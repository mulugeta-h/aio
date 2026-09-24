const { Pool } = require("pg");

const libaioPool = new Pool({
  connectionString: process.env.LOG_DB_URL
});

const harmonizationPool = new Pool({
  connectionString: process.env.LIB_HARMONIZATION_DB_URL
});

const reciptPool = new Pool({
  connectionString: process.env.LIB_RECIPT_DB_URL
});

const connectDB = async () => {
  try {
    const l = await libaioPool.query("SELECT NOW()");
    console.log("Connected to LOG_DB:", l.rows[0].now.toString());

    const h = await harmonizationPool.query("SELECT NOW()");
    console.log("Connected to COMPANY HARMONIZATION_DB:", h.rows[0].now.toString());

    const r = await reciptPool.query("SELECT NOW()");
    console.log("Connected to COMPANY RECIPT_DB:", r.rows[0].now.toString());
  } catch (err) {
    console.error("DB ERROR:", err.message);
    setTimeout(connectDB, 5000);
  }
};

module.exports = {
  connectDB,
  getLibaioPool: () => libaioPool,
  getCompanyPool: () => harmonizationPool,
  getReciptPool: () => reciptPool
};