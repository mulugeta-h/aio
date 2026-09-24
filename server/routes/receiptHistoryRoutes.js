const express = require("express");
const router = express.Router();
const { getLibaioPool } = require("../config/db");
const userAuth = require("../middleware/userAuth");

router.use(userAuth);

// =====================================================
// BASE QUERY
// =====================================================
function buildBaseQuery() {
  return `
    SELECT 
      id,
      reference_id,
      account_number,
      credited_account_number,
      amount,
      bank_id,
      status,
      execution_date,
      downloaded_by,
      user_role,
      downloaded_at
    FROM receipt_history
    WHERE 1=1
  `;
}

// =====================================================
// ROLE-BASED ACCESS CONTROL
// SUPER_ADMIN -> full access
// others -> only their own (by user.id)
// =====================================================
function applyAccessControl(query, params, user, paramIndex) {
  console.log("reaching here" ,user.username);
  if (user?.role === "SUPER_ADMIN") {
    return { query, params, paramIndex };
  }

  query += ` AND downloaded_by = $${paramIndex}`;
  params.push(user.username);
  paramIndex++;
 console.log("reaching here ** " ,query);
  return { query, params, paramIndex };
}

// =====================================================
// TODAY
// =====================================================
router.get("/today", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();
    console.log("reaching here");
    let query = buildBaseQuery();
    let params = [];
    let paramIndex = 1;

    ({ query, params, paramIndex } = applyAccessControl(
      query,
      params,
      req.user,
      paramIndex
    ));

    query += ` ORDER BY downloaded_at DESC`;

    const result = await libaioPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("❌ Today error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's receipts",
      error: error.message,
    });
  }
});

// =====================================================
// ALL
// =====================================================
router.get("/all", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();

    let query = buildBaseQuery();
    let params = [];
    let paramIndex = 1;

    ({ query, params, paramIndex } = applyAccessControl(
      query,
      params,
      req.user,
      paramIndex
    ));

    query += ` ORDER BY downloaded_at DESC LIMIT 1000`;

    const result = await libaioPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("❌ All error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch receipts",
      error: error.message,
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
      referenceId,
      accountNumber,
      bankId,
      status,
      startDate,
      endDate,
    } = req.query;

    let query = buildBaseQuery();
    let params = [];
    let paramIndex = 1;

    if (referenceId) {
      query += ` AND reference_id = $${paramIndex}`;
      params.push(referenceId);
      paramIndex++;
    }

    if (accountNumber) {
      query += ` AND account_number = $${paramIndex}`;
      params.push(accountNumber);
      paramIndex++;
    }

    if (bankId) {
      query += ` AND bank_id = $${paramIndex}`;
      params.push(bankId);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate && endDate) {
      query += ` AND DATE(downloaded_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    ({ query, params, paramIndex } = applyAccessControl(
      query,
      params,
      req.user,
      paramIndex
    ));

    query += ` ORDER BY downloaded_at DESC`;

    const result = await libaioPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("❌ Filter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch filtered receipts",
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

    const result = await libaioPool.query(
      `
      SELECT * FROM receipt_history
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const record = result.rows[0];

    // Access control check (same pattern as your other router)
    if (req.user?.role !== "SUPER_ADMIN") {
      if (record.downloaded_by != req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    res.json({
      success: true,
      data: record,
    });

  } catch (error) {
    console.error("❌ By ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch record",
      error: error.message,
    });
  }
});

// =====================================================
// STATS
// =====================================================
router.get("/stats/summary", async (req, res) => {
  try {
    const libaioPool = getLibaioPool();

    let query = `
      SELECT 
        COUNT(*) as total_downloads,
        COALESCE(SUM(amount),0) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN DATE(downloaded_at) = CURRENT_DATE THEN 1 END) as today_count
      FROM receipt_history
      WHERE 1=1
    `;

    let params = [];
    let paramIndex = 1;

    if (req.user?.role !== "SUPER_ADMIN") {
      query += ` AND downloaded_by = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    const result = await libaioPool.query(query, params);

    res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error("❌ Stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

module.exports = router;