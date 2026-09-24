// server/routes/reciptsRoutes.js
const express = require("express");
const router = express.Router();
const { getReciptPool, getLibaioPool } = require("../config/db");
const userAuth = require("../middleware/userAuth");
const SftpClient = require('ssh2-sftp-client');

// =====================================================
// AUTH MIDDLEWARE
// =====================================================
router.use(userAuth);

// =====================================================
// GET TRANSACTIONS BY ACCOUNT NUMBER AND DATE
// =====================================================
router.get("/transactions", async (req, res) => {
  try {
    const { accountNumber,date } = req.query;
    const  downloadedBy =req.user.username;
    const today = new Date();

    console.log("Receipt:", accountNumber, date, downloadedBy);

    if (!accountNumber || !date || !downloadedBy) {
      return res.status(400).json({
        success: false,
        message: "accountNumber, date, downloadedBy required"
      });
    }

    const receiptPool = await getReciptPool();
    const libaioPool = await getLibaioPool(); // 🔥 IMPORTANT

    // Step 1: get transactions
    const txQuery = `
      SELECT 
        t."accountId",
        t."AccountNumber",
        t."AccountHolderName",
        t."CreditedAccountNumber",
        t."referenceId",
        t."amount",
        t."requestedExecutionDate",
        t."paymentType",
        t."paymentScheme",
        t."bankId",
        t."status"
      FROM public."Transaction" t
      WHERE t."AccountNumber" = $1
        AND t."requestedExecutionDate"::date = $2
        
      ORDER BY t."requestedExecutionDate" DESC
    `;
      //AND t."status" ='Sucessful Transaction'
    const txResult = await receiptPool.query(txQuery, [
      accountNumber,
      date
    ]);
     
    const transactions = txResult.rows;
    if(transactions.length===0){
      return res.status(409).json({
        success: false,
        message: "No referenceId (Recipt) found for this Transaction!"
      });
    }
    console.log("reference ID : ",transactions[0].referenceId)

    // Step 2: get history (FROM LIBAIO DB)
    const refIds = transactions
      .map(t => t.referenceId)
      .filter(Boolean);

    let historyMap = {};

    if (refIds.length > 0) {
      const historyQuery = `
        SELECT reference_id
        FROM public.receipt_history
        WHERE reference_id = ANY($1)
          AND downloaded_by = $2
          AND downloaded_at::date = $3
      `;

      const historyResult = await libaioPool.query(historyQuery, [
        refIds,
        downloadedBy,
        today
      ]);

      historyResult.rows.forEach(row => {
        historyMap[row.reference_id] = true;
      });
    }

    // Step 3: attach flag
    const finalData = transactions.map(t => {
  //const isDownloadedToday = !!historyMap[t.referenceId];
const isDownloadedToday = false;

  console.log("Is", t.referenceId, isDownloadedToday,date);

  return {
    ...t,
    isDownloadedToday
  };
});
    
    res.json({
      success: true,
      count: finalData.length,
      data: finalData
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message
    });
  }
});

//Fetch recipt 
router.get("/view/:referenceId", async (req, res) => {
  const sftp = new SftpClient();
  try {
    const { referenceId } = req.params;
    console.log(`\n--- Fetching Receipt ---`);
    console.log(`Reference ID: ${referenceId}`);
    console.log(`------------------------\n`);

    const filename = `${referenceId}.pdf`;

    const path1 = `/etc/nginx/Receipt_Generate/Receipt/${filename}`;
    const path2 = `/receipts/${filename}`;

    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD,
    });

    let targetPath = null;

    if (await sftp.exists(path1)) {
      targetPath = path1;
    } else if (await sftp.exists(path2)) {
      targetPath = path2;
    }

    if (!targetPath) {
      await sftp.end();
      return res.status(404).json({
        message: "Receipt PDF not found on Linux server",
        referenceId
      });
    }

    console.log(targetPath, 'targetpath')
    res.setHeader('Content-Type', 'application/pdf');
    await sftp.get(targetPath, res);
    await sftp.end();

  } catch (error) {
    console.error('Error fetching receipt over SFTP:', error);
    sftp.end().catch(() => { });
    return res.status(500).json({
      message: "Unable to retrieve receipt"
    });
  }
});

// =====================================================
// LOG RECEIPT DOWNLOAD - RECEIVES ALL DATA
// =====================================================
router.post("/log", async (req, res) => {
  try {
    const {
      referenceId,
      accountNumber,
      creditedAccountNumber,
      amount,
      bankId,
      status,
      executionDate,
      downloadedBy,
      userRole,
      downloadedAt
    } = req.body;

    const pool = await getLibaioPool();

    // normalize "today" comparison (date only)
    const checkQuery = `
      SELECT 1
      FROM public.receipt_history
      WHERE reference_id = $1
        AND downloaded_by = $2
        AND DATE(downloaded_at) = DATE($3)
      LIMIT 1
    `;

    const existing = await pool.query(checkQuery, [
      referenceId,
      downloadedBy,
      downloadedAt
    ]);

    if (existing.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Duplicate receipt already logged for today"
      });
    }

    const insertQuery = `
      INSERT INTO public.receipt_history (
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
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `;

    await pool.query(insertQuery, [
      referenceId,
      accountNumber,
      creditedAccountNumber,
      amount,
      bankId,
      status,
      executionDate,
      downloadedBy,
      userRole,
      downloadedAt
    ]);

    res.status(200).json({
      success: true,
      message: "Receipt logged successfully"
    });

  } catch (error) {
    console.error("❌ Error logging receipt:", error);

    res.status(500).json({
      success: false,
      message: "Failed to log receipt",
      error: error.message
    });
  }
});
module.exports=router;// server/routes/reciptsRoutes.js
