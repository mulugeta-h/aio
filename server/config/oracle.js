// config/oracle.js

const oracledb = require("oracledb");

const pools = {};

async function connectOracle(name) {
  if (pools[name]) return;

  const config = JSON.parse(process.env[name]);

  pools[name] = await oracledb.createPool({
    user: config.user,
    password: config.password,
    connectString: config.connectString,
    poolAlias: name,
  });

  console.log(`Connected to ${name}`);
}

function getOraclePool(name) {
  return pools[name];
}

module.exports = {
  connectOracle,
  getOraclePool,
};