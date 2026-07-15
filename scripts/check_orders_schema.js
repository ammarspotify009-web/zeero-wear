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

async function check() {
  await client.connect();

  // Get column names
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders'
    ORDER BY ordinal_position;
  `);
  console.log('=== ORDERS TABLE COLUMNS ===');
  cols.rows.forEach(r => console.log(r.column_name, ':', r.data_type));

  // Get actual rows
  const rows = await client.query('SELECT * FROM orders LIMIT 5;');
  console.log('\n=== ORDERS DATA ===');
  console.log(JSON.stringify(rows.rows, null, 2));

  await client.end();
}

check().catch(console.error);
