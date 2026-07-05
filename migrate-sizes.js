import pg from 'pg';

const connectionString = "postgresql://postgres.pgefuifzakvratosuqoy:160205@Ammar@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const pool = new pg.Pool({
  connectionString,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Connected to Supabase. Creating sizes table...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS sizes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("Sizes table created. Inserting default sizes...");

    const defaultSizes = ['NB', '0-3M', '3-6M', '6-9M', '1Y', '2Y', '3-4Y', '5-6Y', '7-8Y', '17', '18', '20', '32', '33', '34'];
    
    for (const sz of defaultSizes) {
      await client.query(`
        INSERT INTO sizes (name) VALUES ($1)
        ON CONFLICT (name) DO NOTHING;
      `, [sz]);
    }

    console.log("Default sizes seeded successfully.");
  } catch (err) {
    console.error("Error migrating sizes table:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
