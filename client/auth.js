const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { getLibaioPool } = require("../config/db");

const router = express.Router();

/* LOGIN */
router.post("/login", async (req, res) => {
  const pool = getLibaioPool();
  const { username, password } = req.body;
 console.log("username : ",username);
  const userRes = await pool.query(
    "SELECT * FROM users WHERE username=$1 AND enabled=true",
    [username]
  );

  const user = userRes.rows[0];
  if (!user) return res.status(400).json({ msg: "Invalid user" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: "Wrong password" });

  await pool.query(
    "UPDATE sessions SET is_active=false WHERE user_id=$1",
    [user.id]
  );

  const sessionToken = crypto.randomUUID();

  await pool.query(
    `INSERT INTO sessions(user_id, session_token)
     VALUES($1,$2)`,
    [user.id, sessionToken]
  );

  const token = jwt.sign(
    { id: user.id, role: user.role, session: sessionToken },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  res.json({ token });
});

/* LOGOUT */
router.post("/logout", async (req, res) => {
  const pool = getLibaioPool();
  const token = req.header("Authorization")?.replace("Bearer ", "");

  const decoded = jwt.decode(token);

  await pool.query(
    "UPDATE sessions SET is_active=false WHERE user_id=$1",
    [decoded.id]
  );

  res.json({ msg: "Logged out" });
});

module.exports = router;