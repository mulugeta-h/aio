// server/routes/harmonizationRoutes.js
const express = require("express");
const router = express.Router();
const { getCompanyPool, getLibaioPool } = require("../config/db");
const userAuth = require("../middleware/userAuth");
// =====================================================
// AUTH MIDDLEWARE
// =====================================================
router.use(userAuth);

// ========================================================================
// GET /api/harmonization/compare-accounts
// Description: Compare accounts between new and old core data
// Query Parameters: searchType, searchValue (Required)
// ========================================================================
router.get("/compare-accounts", async (req, res) => {
  try {
    const pool = getCompanyPool();
    const { searchType, searchValue } = req.query;
    console.log("Search Type:", searchType, "Value:", searchValue);
    const poolx2 = getLibaioPool();
    //await resetNonUpdatedRecords(pool, poolx2, null);
    // Validate required parameters
    if (!searchType || !searchValue) {
      return res.status(400).json({
        success: false,
        message: "searchType and searchValue are required"
      });
    }

    let newData = [];
    let oldData = [];

    // Build search conditions
    let newWhereClause = "1=1";
    let newParams = [];
    let newParamIndex = 1;

    let oldWhereClause = "1=1";
    let oldParams = [];
    let oldParamIndex = 1;

    if (searchType === "account_number") {
      newWhereClause = `account_number = $${newParamIndex}`;
      newParams.push(searchValue);
      newParamIndex++;
      
      oldWhereClause = `account_number = $${oldParamIndex}`;
      oldParams.push(searchValue);
      oldParamIndex++;
    } 
  
    else if (searchType === "full_name") {
      newWhereClause = `full_name ILIKE $${newParamIndex}`;
      newParams.push(`%${searchValue}%`);
      newParamIndex++;
      
      oldWhereClause = `full_name ILIKE $${oldParamIndex}`;
      oldParams.push(`%${searchValue}%`);
      oldParamIndex++;
    } 
    else if (searchType === "phone") {
      newWhereClause = `phone = $${newParamIndex}`;
      newParams.push(searchValue);
      newParamIndex++;
      
      oldWhereClause = `phone = $${oldParamIndex}`;
      oldParams.push(searchValue);
      oldParamIndex++;
    } 
    else if (searchType === "national_id") {
      newWhereClause = `national_id = $${newParamIndex}`;
      newParams.push(searchValue);
      newParamIndex++;
      
      oldWhereClause = `national_id = $${oldParamIndex}`;
      oldParams.push(searchValue);
      oldParamIndex++;
    } 
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid searchType. Must be: account_number, customer_id, full_name, phone, or national_id"
      });
    }

    // Fetch from new_core_data
    const newQuery = `
      SELECT 
        id,
        customer_id,
        full_name,
        national_id,
        gender,
        phone,
        status,
        updated_at,
        modified_date,
        account_number
      FROM public.new_core_data
      WHERE ${newWhereClause}
      ORDER BY id ASC
    `;
    
    const newResult = await pool.query(newQuery, newParams);
    newData = newResult.rows;

    // Fetch from old_core_data
    const oldQuery = `
      SELECT 
        id,
        customer_id,
        first_name,
        middle_name,
        last_name,
        full_name,
        national_id,
        gender,
        phone,
        created_at,
        account_number
      FROM public.old_core_data
      WHERE ${oldWhereClause}
      ORDER BY id ASC
    `;
    
    const oldResult = await pool.query(oldQuery, oldParams);
    oldData = oldResult.rows;

    res.json({
      success: true,
      new_data: newData,
      old_data: oldData,
      total_new: newResult.rowCount,
      total_old: oldResult.rowCount
    });

  } catch (err) {
    console.error('Comparison error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Error comparing accounts'
    });
  }
});

// ========================================================================
// GET /api/harmonization/compare-accounts/:accountNumber
// Description: Get specific account comparison by account number
// Path Parameters: accountNumber
// ========================================================================
router.get("/compare-accounts/:accountNumber", async (req, res) => {
  try {
    const pool = getCompanyPool();
    const { accountNumber } = req.params;

    // Fetch from new_core_data
    const newResult = await pool.query(`
      SELECT *
      FROM public.new_core_data
      WHERE account_number = $1 OR customer_id = $1
    `, [accountNumber]);

    // Fetch from old_core_data
    const oldResult = await pool.query(`
      SELECT *
      FROM public.old_core_data
      WHERE account_number = $1 OR customer_id = $1
    `, [accountNumber]);

    const newRecord = newResult.rows[0] || null;
    const oldRecord = oldResult.rows[0] || null;

    res.json({
      success: true,
      data: {
        account_number: accountNumber,
        customer_id: newRecord?.customer_id || oldRecord?.customer_id,
        old_data: oldRecord,
        new_data: newRecord,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account comparison"
    });
  }
});

// ========================================================================
// PUT /api/harmonization/new-core/:id/status
// Description: Update status in new core data
// Path Parameters: id
// Request Body: status
// ========================================================================
router.put("/new-core/:id/status", async (req, res) => {
  try {
    const pool = getCompanyPool();
    const poolx2 = getLibaioPool();
    const { status, reason } = req.body;
    const id = req.params.id;

    console.log("Updating status to:", status, id, reason, req.user?.id);

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    if (!["UPDATED", "UPDATEDs"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'UPDATED' or 'UPDATEDs'"
      });
    }

    // 1. Get old status and account number
    const oldDataResult = await pool.query(
      `SELECT status, account_number FROM public.new_core_data WHERE id = $1`,
      [id]
    );

    if (!oldDataResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    const old_status = oldDataResult.rows[0].status;
    const account_number = oldDataResult.rows[0].account_number;

    // 2. Update status
    const result = await pool.query(
      `
      UPDATE public.new_core_data
      SET status = $1, modified_date = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    // 3. Save history without NOW() - using JavaScript Date
    const created_at = new Date();
    
    await poolx2.query(
      `
      INSERT INTO status_history (
        account_id, 
        account_number, 
        old_status, 
        new_status, 
        changed_by, 
        reason,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        id,                           // account_id
        account_number,               // account_number
        old_status,                   // old_status
        status,                       // new_status
        req.user?.id || null,        // changed_by
        reason || null,              // reason
        created_at                   // created_at - using JavaScript Date
      ]
    );

    res.json({
      success: true,
      message: "Status updated successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: err.message
    });
  }
});



// ========================================================================
// GET /api/harmonization/search
// Description: Generic search across both tables
// Query Parameters: q (search query), type (optional)
// ========================================================================
router.get("/search", async (req, res) => {
  try {
    const pool = getCompanyPool();
    const { q, type = 'all' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    let newQuery = `
      SELECT *
      FROM public.new_core_data
      WHERE 
        full_name ILIKE $1 OR
        customer_id ILIKE $1 OR
        account_number ILIKE $1 OR
        phone ILIKE $1 OR
        national_id ILIKE $1
    `;

    let oldQuery = `
      SELECT *
      FROM public.old_core_data
      WHERE 
        full_name ILIKE $1 OR
        customer_id ILIKE $1 OR
        account_number ILIKE $1 OR
        phone ILIKE $1 OR
        national_id ILIKE $1
    `;

    const searchPattern = `%${q}%`;

    const [newResult, oldResult] = await Promise.all([
      pool.query(newQuery, [searchPattern]),
      pool.query(oldQuery, [searchPattern])
    ]);



    res.json({
      success: true,
      data: {
        new_core: newResult.rows,
        old_core: oldResult.rows,
        total_new: newResult.rowCount,
        total_old: oldResult.rowCount
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
});

module.exports=router;
