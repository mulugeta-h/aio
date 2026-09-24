// server/routes/harmonizationRoutes.js
const express = require("express");
const router = express.Router();
const { getCompanyPool, getLibaioPool } = require("../config/db");

router.put("/resetUPDATEDsRecords", async (req, res) => {
  try {
    const pool = getCompanyPool();
    const poolx2 = getLibaioPool();
    const query = `
      SELECT *
      FROM public.new_core_data
      WHERE status = 'UPDATEDs'
      ORDER BY modified_date DESC`;

    const { rows } = await pool.query(query);

    console.log("Non-updated size:", rows.length);

    const created_at = new Date();
    const changed_by = req.user?.id || null;

    for (const record of rows) {
      const payload = {
        account_id: record.id,
        account_number: record.account_number,
        old_status: record.status,
        new_status: "UPDATED",
        changed_by,
        reason: "Bulk reset to UPDATED",
        created_at,
      };

      console.log("Prepared bulk history:", payload);
       
      // Save history
      await createBulkHistory(poolx2, payload);

      // Update status
      await pool.query(
        `
        UPDATE public.new_core_data
        SET status = 'UPDATED',
            modified_date = NOW()
        WHERE id = $1
        `,
        [record.id]
      );
    }

    res.json({
      success: true,
      message: `${rows.length} records reset successfully.`,
      count: rows.length,
    });

  } catch (error) {
    console.error("Failed to process UPDATEDs records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset records.",
      error: error.message,
    });
  }
});

async function createBulkHistory(pool, {
  account_id,
  account_number,
  old_status,
  new_status,
  changed_by,
  reason,
  created_at
}) {
  try {
    const query = `
      INSERT INTO bulk_history (
        account_id,
        account_number,
        old_status,
        new_status,
        changed_by,
        reason,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      account_id,
      account_number,
      old_status,
      new_status,
      changed_by,
      reason,
      created_at
    ];

    
    const { rows } = await pool.query(query, values);

    return rows[0];
  } catch (error) {
    console.error("Failed to create bulk history:", error);
    throw error;
  }
}



async function resetNonUpdatedRecords(pool, poolx2, changed_by = null) {
  try {
    const query = `
      SELECT *
      FROM public.new_core_data
      WHERE status IS DISTINCT FROM 'UPDATED'
      ORDER BY modified_date DESC LIMIT 10`;

    const { rows } = await pool.query(query);
// ONE shared timestamp for everything
    const sharedTime = new Date();
    console.log("non updated size:", rows.length,sharedTime);

    for (const record of rows) {
      const payload = {
        account_id: record.id,
        account_number: record.account_number,
        old_status: record.status,
        new_status: "UPDATED",
        changed_by,
        reason: "Bulk reset to UPDATED",
        created_at: sharedTime
      };

      await createBulkHistory(poolx2, payload);

      await pool.query(
        `
        UPDATE public.new_core_data
        SET status = 'UPDATED',
            modified_date = $2
        WHERE id = $1
        `,
        [record.id, sharedTime]
      );
    }

    return rows;
  } catch (error) {
    console.error("Failed to process non-updated records:", error);
    throw error;
  }
}

module.exports=router;