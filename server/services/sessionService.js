const crypto = require("crypto");
const { getLibaioPool } = require("../config/db");

const INACTIVITY_MS = 15 * 60 * 1000;

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

/* =========================
   CREATE SESSION
========================= */
async function createSession(userId, deviceId, ipAddress, userAgent) {
  const pool = getLibaioPool();
  const sessionToken = createSessionToken();

  // deactivate previous sessions (single-session login)
  await pool.query(
    `
    UPDATE sessions
    SET is_active = false,
        last_logout_at = NOW()
    WHERE user_id = $1
      AND is_active = true
    `,
    [userId]
  );

  // create new session
  const result = await pool.query(
    `
    INSERT INTO sessions (
      user_id,
      session_token,
      device_id,
      ip_address,
      user_agent,
      last_activity,
      last_login_at,
      is_active
    )
    VALUES ($1,$2,$3,$4,$5,NOW(),NOW(),true)
    RETURNING *
    `,
    [
      userId,
      sessionToken,
      deviceId || "unknown",
      ipAddress || "unknown",
      userAgent || "unknown",
    ]
  );

  return {
    session: result.rows[0],
    sessionToken,
  };
}

/* =========================
   VALIDATE SESSION
========================= */
async function validateSession(userId, sessionToken, deviceId) {
  const pool = getLibaioPool();

  const result = await pool.query(
    `
    SELECT *
    FROM sessions
    WHERE user_id = $1
      AND is_active = true
    ORDER BY last_activity DESC
    LIMIT 1
    `,
    [userId]
  );

  const session = result.rows[0];

  if (!session) {
    return { valid: false, msg: "Session expired. Please login again." };
  }

  if (session.session_token !== sessionToken) {
    return { valid: false, msg: "Logged in on another device." };
  }

  if (deviceId && session.device_id !== deviceId) {
    return { valid: false, msg: "Device mismatch." };
  }

  const inactiveMs =
    Date.now() - new Date(session.last_activity).getTime();

  if (inactiveMs > INACTIVITY_MS) {
    await pool.query(
      `
      UPDATE sessions
      SET is_active = false,
          last_logout_at = NOW()
      WHERE id = $1
      `,
      [session.id]
    );

    return { valid: false, msg: "Session expired due to inactivity." };
  }

  // update activity
  await pool.query(
    `
    UPDATE sessions
    SET last_activity = NOW()
    WHERE id = $1
    `,
    [session.id]
  );

  return { valid: true, session };
}

/* =========================
   INVALIDATE SESSION
========================= */
async function invalidateSession(userId) {
  const pool = getLibaioPool();

  await pool.query(
    `
    UPDATE sessions
    SET is_active = false,
        last_logout_at = NOW()
    WHERE user_id = $1
    `,
    [userId]
  );
}

module.exports = {
  INACTIVITY_MS,
  createSession,
  validateSession,
  invalidateSession,
};