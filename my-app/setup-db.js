import pg from 'pg';

const connectionString = "postgresql://postgres.pgefuifzakvratosuqoy:160205@Ammar@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const pool = new pg.Pool({
  connectionString,
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log("Connected to Supabase. Creating tables...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        "customerName" VARCHAR(255),
        "customerPhone" VARCHAR(50),
        "customerEmail" VARCHAR(255),
        "customerAddress" TEXT,
        city VARCHAR(100),
        "productName" VARCHAR(255),
        "productImage" TEXT,
        quantity INTEGER,
        size VARCHAR(50),
        "totalAmount" INTEGER,
        status VARCHAR(50),
        "orderDate" VARCHAR(50)
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS queries (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        message TEXT,
        date VARCHAR(50),
        status VARCHAR(50)
      );
    `);

    console.log("Tables created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    client.release();
    pool.end();
  }
}

setup();
