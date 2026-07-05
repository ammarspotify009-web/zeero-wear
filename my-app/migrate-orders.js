import pg from 'pg';

const connectionString = "postgresql://postgres.pgefuifzakvratosuqoy:160205@Ammar@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const pool = new pg.Pool({
  connectionString,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Connected to Supabase. Dropping and recreating orders table...");

    await client.query(`DROP TABLE IF EXISTS orders;`);

    await client.query(`
      CREATE TABLE orders (
        id VARCHAR(50) PRIMARY KEY,
        "customerName" VARCHAR(255),
        "customerPhone" VARCHAR(50),
        "customerEmail" VARCHAR(255),
        "customerAddress" TEXT,
        city VARCHAR(100),
        "paymentMethod" VARCHAR(50),
        subtotal INTEGER,
        "deliveryFee" INTEGER,
        "totalAmount" INTEGER,
        items JSONB,
        notes TEXT,
        status VARCHAR(50),
        "orderDate" VARCHAR(50),
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Orders table created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
