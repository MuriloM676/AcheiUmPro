const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 300;

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function queryWithRetry(pool, sql, params = [], attempts = MAX_RETRIES) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      lastErr = err;
      // For SQL transient errors we retry; for schema missing, bubble up quickly
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        throw err;
      }
      await sleep(RETRY_DELAY_MS * (i + 1));
    }
  }
  throw lastErr;
}

module.exports = { queryWithRetry };

