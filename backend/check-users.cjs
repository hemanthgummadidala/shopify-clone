const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/shopify_clone'
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, email, name, role, created_at FROM users ORDER BY id ASC');
    console.log('--- REGISTERED USERS ---');
    console.log(res.rows);
    console.log('------------------------');
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
