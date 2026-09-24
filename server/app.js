require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const { connectDB } = require("./config/db");
const { connectOracle } = require("./config/oracle");

const app = express();



const helmet = require("helmet");

app.use(
  helmet({
    frameguard: { action: "deny" }
  })
);

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

/* DB CONNECT */
connectDB();
connectOracle("ORACLE1");

/* ROUTES */
app.use("/api/user", require("./routes/userRoutes"));

app.use("/api/adminDashboard", require("./routes/adminDashboardRoutes"));
app.use("/api/superDashboard", require("./routes/superDashboardRoutes"));
app.use("/api/admin", require("./routes/superAdminRoutes"));

app.use("/api/harmonization", require("./routes/harmonizationRoutes"));
app.use("/api/harmonizationHistory", require("./routes/harmonizationHistoryRoutes"));

app.use("/api/receipt", require("./routes/receiptRoutes"));
app.use("/api/receipt-history", require("./routes/receiptHistoryRoutes"));
 
app.use("/api/reset", require("./routes/resetRoutes"));

/* HEALTH */
app.get("/", (req, res) => {
  res.json({ msg: "LIBAIO running" });
});

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log("Server running on", process.env.PORT); 
});

//setInterval(resetAll, 15 * 60 * 1000);

async function resetAll() {
  try {
    const now = new Date();

    const day = now.getDay();
    const hour = now.getHours();

    // Only Sunday
    if (day !== 0) {
      console.log("⏰ Reset skipped. Not Sunday:", now.toLocaleString());
      return;
    }

    // Only 07:00 - 07:59
    if (hour !== 7) {
      console.log("⏰ Reset skipped. Outside time window:", now.toLocaleString());
      return;
    }

    console.log("✅ Reset window active:", now.toLocaleString());

    await axios.put(
      `${process.env.VITE_API_URL}/api/reset/resetUPDATEDsRecords`
    );

    console.log("✅ Sunday reset completed");

  } catch (err) {
    console.error(
      "❌ Reset job failed:",
      err.response?.data || err.message
    );
  }
}

