const express = require("express");
const router = express.Router();
const { getCompanyPool } = require("../config/db");

const pool = getCompanyPool();

router.get("/dashboard", async (req, res) => {
  try {
    // NEW CORE DATA
    console.log("Numeric data fecthing " );
    const newDataRes = await pool.query(`
      SELECT
        customer_id,
        account_number,
        national_id,
        phone,
        gender,
        status
      FROM public.new_core_data
    `);

    // OLD CORE DATA
    const oldDataRes = await pool.query(`
      SELECT
        customer_id,
        account_number,
        national_id,
        phone,
        gender
      FROM public.old_core_data
    `);

    const newRows = newDataRes.rows;
    const oldRows = oldDataRes.rows;

    // Helpers
    const countStatus = (rows, value) =>
      rows.filter(
        (r) => (r.status || "").trim().toLowerCase() === value.toLowerCase()
      ).length;

    const countGender = (rows, gender) =>
      rows.filter(
        (r) => (r.gender || "").trim().toLowerCase() === gender.toLowerCase()
      ).length;

    const uniqueCount = (rows, field) =>
      new Set(
        rows
          .map((r) => r[field]?.toString().trim())
          .filter(Boolean)
      ).size;

    // NEW CORE STATS
    const newStats = {
      total: newRows.length,
      status: {
        updated: countStatus(newRows, "UPDATED"),
        updateds: countStatus(newRows, "UPDATEDs"),
      },
      gender: {
        male: countGender(newRows, "m"),
        female: countGender(newRows, "f"),
      },
      uniques: {
        customer_id: uniqueCount(newRows, "customer_id"),
        account_number: uniqueCount(newRows, "account_number"),
        national_id: uniqueCount(newRows, "national_id"),
        phone: uniqueCount(newRows, "phone"),
      },
    };

    // OLD CORE STATS
    const oldStats = {
      total: oldRows.length,
      gender: {
        male: countGender(oldRows, "m"),
        female: countGender(oldRows, "f"),
      },
      uniques: {
        customer_id: uniqueCount(oldRows, "customer_id"),
        account_number: uniqueCount(oldRows, "account_number"),
        national_id: uniqueCount(oldRows, "national_id"),
        phone: uniqueCount(oldRows, "phone"),
      },
    };
//console.log("Numeric data fecthed " ,oldStats,newStats);
    res.json({
      success: true,
      new_core_data: newStats,
      old_core_data: oldStats,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Dashboard fetch failed",
      error: err.message,
    });
  }
});

module.exports = router;