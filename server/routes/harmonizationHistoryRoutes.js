const express = require("express");
const router = express.Router();
const { getCompanyPool, getLibaioPool } = require("../config/db");
const userAuth = require("../middleware/userAuth");

router.use(userAuth);

// =====================================================
// ACCOUNT DETAILS (company DB)
// =====================================================
async function getAccountDetails(accountId) {
  try {
    const companyPool = getCompanyPool();

    const result = await companyPool.query(
      `
      SELECT customer_id, full_name 
      FROM public.new_core_data 
      WHERE id = $1
      `,
      [accountId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching account details:", error);
    return null;
  }
}

// =====================================================
// ROLE-BASED ACCESS CONTROL
// super_admin -> full access
// others -> only their own changed_by
// =====================================================
function applyAccessControl(query, params, user, paramIndex) {
  if (user?.role === "SUPER_ADMIN") {
    return { query, params, paramIndex };
  }

  query += ` AND sh.changed_by = $${paramIndex}`;
  params.push(user.id);
  paramIndex++;

  return { query, params, paramIndex };
}

// =====================================================
// BASE QUERY
// =====================================================
function buildBaseQuery() {
  return `
    SELECT 
      sh.id,
      sh.account_id,
      sh.account_number,
      sh.old_status,
      sh.new_status,
      sh.changed_by,
      sh.reason,
      sh.created_at,
      u.username AS changed_by_name
    FROM status_history sh
    LEFT JOIN users u ON sh.changed_by = u.id
    WHERE 1=1
  `;
}

// =====================================================
// ENRICH DATA (company DB lookup)
// =====================================================
async function enrich(rows) {
  return Promise.all(
    rows.map(async (record) => {
      const accountDetails = record.account_id
        ? await getAccountDetails(record.account_id)
        : null;

      return {
        ...record,
        customer_id: accountDetails?.customer_id || null,
        full_name: accountDetails?.full_name || null,
      };
    })
  );
}

// =====================================================
// ADMIN LIST (unchanged - super_admin only use case)
// =====================================================
router.get("/admins", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();
    const user = req.user;

    let result;

    // =====================================================
    // SUPER_ADMIN → return all admins
    // =====================================================
    if (user?.role === "SUPER_ADMIN") {
      result = await libaioPool.query(`
        SELECT DISTINCT u.username
        FROM status_history sh
        INNER JOIN users u ON sh.changed_by = u.id
        WHERE sh.changed_by IS NOT NULL
        ORDER BY u.username ASC
      `);
    }

    // =====================================================
    // OTHER USERS → only themselves
    // =====================================================
    else {
      result = await libaioPool.query(
        `
        SELECT DISTINCT u.username
        FROM status_history sh
        INNER JOIN users u ON sh.changed_by = u.id
        WHERE sh.changed_by = $1
        ORDER BY u.username ASC
        `,
        [user.id]
      );
    }

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
    });
  }
});

// =====================================================
// TODAY
// =====================================================
router.get("/today", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();

    let query = buildBaseQuery();
    let params = [];
    let paramIndex = 1;

    query += ` AND DATE(sh.created_at) = CURRENT_DATE`;

    ({ query, params, paramIndex } = applyAccessControl(
      query,
      params,
      req.user,
      paramIndex
    ));

    query += ` ORDER BY sh.created_at DESC`;

    const result = await libaioPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: await enrich(result.rows),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's history",
    });
  }
});

// =====================================================
// ALL HISTORY
// =====================================================
router.get("/all", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();
    console.log("Role ",req.user.role);
    let query = buildBaseQuery();
    let params = [];
    let paramIndex = 1;

    ({ query, params, paramIndex } = applyAccessControl(
      query,
      params,
      req.user,
      paramIndex
    ));

    query += ` ORDER BY sh.created_at DESC LIMIT 1000`;

    const result = await libaioPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: await enrich(result.rows),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history",
    });
  }
});

// =====================================================
// EXCEPT AUTO (manual only)
// =====================================================
router.get("/except-auto", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();

    let query = buildBaseQuery();
    let params = [];
    let paramIndex = 1;

    query += ` AND sh.changed_by IS NOT NULL`;

    ({ query, params, paramIndex } = applyAccessControl(
      query,
      params,
      req.user,
      paramIndex
    ));

    query += ` ORDER BY sh.created_at DESC LIMIT 1000`;

    const result = await libaioPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: await enrich(result.rows),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manual history",
    });
  }
});

// =====================================================
// FILTERED
// =====================================================
router.get("/filtered", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();

    const {
      searchType,
      searchValue,
      startDate,
      endDate,
      changedBy,
    } = req.query;

    let query = buildBaseQuery();
    let params = [];
    let paramIndex = 1;

    // account filter
    if (searchType === "account" && searchValue) {
      query += ` AND sh.account_number = $${paramIndex}`;
      params.push(searchValue);
      paramIndex++;
    }

    // date filter
    else if (searchType === "date" && startDate && endDate) {
      query += ` AND DATE(sh.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    // changedBy filter
    else if (searchType === "changedBy" && changedBy) {
      if (changedBy === "system") {
        query += ` AND sh.changed_by IS NULL`;
      } else if (changedBy === "manual") {
        query += ` AND sh.changed_by IS NOT NULL`;
      } else {
        query += ` AND LOWER(u.username) = LOWER($${paramIndex})`;
        params.push(changedBy);
        paramIndex++;
      }
    }

    // today shortcut
    else if (searchType === "today") {
      query += ` AND DATE(sh.created_at) = CURRENT_DATE`;
    }

    ({ query, params, paramIndex } = applyAccessControl(
      query,
      params,
      req.user,
      paramIndex
    ));

    query += ` ORDER BY sh.created_at DESC`;

    const result = await libaioPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: await enrich(result.rows),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch filtered history",
      error: error.message,
    });
  }
});

// =====================================================
// BY ID
// =====================================================
router.get("/:id", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();

    let query = buildBaseQuery();
    let params = [req.params.id];

    query += ` AND sh.id = $1`;

    const result = await libaioPool.query(query, params);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.json({
      success: true,
      data: (await enrich(result.rows))[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch record",
    });
  }
});

module.exports = router;