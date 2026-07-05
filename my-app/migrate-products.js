import pg from 'pg';

const connectionString = "postgresql://postgres.pgefuifzakvratosuqoy:160205@Ammar@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const pool = new pg.Pool({
  connectionString,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Connected to Supabase. Altering products table...");

    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(50) DEFAULT 'none';
    `);

    console.log("Products table altered successfully.");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
