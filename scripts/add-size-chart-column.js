import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres.pgefuifzakvratosuqoy',
  password: '160205@Ammar',
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // Add sizeChart column to products table
    const result = await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS "sizeChart" TEXT;');
    console.log('Migration successful:', result);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
