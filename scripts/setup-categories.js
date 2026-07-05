import pg from 'pg';

const connectionString = "postgresql://postgres.pgefuifzakvratosuqoy:160205@Ammar@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const pool = new pg.Pool({ connectionString });

const DEFAULT_CATEGORIES = [
  { id: 'new-arrivals', name: 'New Arrivals', parent_id: null, show_in_sidebar: true, sort_order: 1, badge: null, badge_color: null },
  { id: 'new-born', name: 'New Born', parent_id: null, show_in_sidebar: true, sort_order: 2, badge: '0-3 Months', badge_color: 'badge-teal' },
  { id: 'baby-boy', name: 'Baby Boy Collection', parent_id: null, show_in_sidebar: true, sort_order: 3, badge: '0-2 Years', badge_color: 'badge-teal' },
  { id: 'baby-girl', name: 'Baby Girl Collection', parent_id: null, show_in_sidebar: true, sort_order: 4, badge: '0-2 Years', badge_color: 'badge-teal' },
  { id: 'boy', name: 'Boys Collection', parent_id: null, show_in_sidebar: true, sort_order: 5, badge: '2 - 10 Years', badge_color: 'badge-teal' },
  { id: 'girl', name: 'Girls Collection', parent_id: null, show_in_sidebar: true, sort_order: 6, badge: '2 - 12 Years', badge_color: 'badge-teal' },
  { id: 'hadid', name: 'Hadid Eastern Wear', parent_id: null, show_in_sidebar: true, sort_order: 7, badge: '3 - 12 Years', badge_color: 'badge-teal' },
  { id: 'footwear', name: 'Premium Footwear', parent_id: null, show_in_sidebar: true, sort_order: 8, badge: null, badge_color: null },
  { id: 'accessories', name: 'Kids Accessories', parent_id: null, show_in_sidebar: true, sort_order: 9, badge: null, badge_color: null },
  { id: 'trending', name: 'Trending Products', parent_id: null, show_in_sidebar: true, sort_order: 10, badge: 'Hot 🔥🔥', badge_color: 'badge-teal' },
  { id: 'sale', name: 'End of Season Sale', parent_id: null, show_in_sidebar: true, sort_order: 11, badge: '30% Off to 50% Off', badge_color: 'badge-red' },
  { id: 'bestsellers', name: 'Best Sellers', parent_id: null, show_in_sidebar: true, sort_order: 12, badge: 'Premium Quality', badge_color: 'badge-red' },
  // Children - inserted after parents
  { id: 'rompers', name: 'Rompers', parent_id: 'baby-boy', show_in_sidebar: true, sort_order: 1, badge: null, badge_color: null },
  { id: 'sets', name: 'Sets', parent_id: 'baby-boy', show_in_sidebar: true, sort_order: 2, badge: null, badge_color: null },
  { id: 't-shirts', name: 'T-Shirts', parent_id: 'baby-boy', show_in_sidebar: true, sort_order: 3, badge: null, badge_color: null },
  { id: 'polos', name: 'Polos', parent_id: 'baby-boy', show_in_sidebar: true, sort_order: 4, badge: null, badge_color: null },
  { id: 'shirts', name: 'Shirts', parent_id: 'baby-boy', show_in_sidebar: true, sort_order: 5, badge: null, badge_color: null },
  { id: 'formal-suits', name: 'Formal Suits', parent_id: 'baby-boy', show_in_sidebar: true, sort_order: 6, badge: null, badge_color: null },
  { id: 'sunglasses', name: 'Sunglasses', parent_id: 'accessories', show_in_sidebar: true, sort_order: 1, badge: null, badge_color: null },
  { id: 'socks', name: 'Socks', parent_id: 'accessories', show_in_sidebar: false, sort_order: 2, badge: null, badge_color: null },
  { id: 'summer-sale', name: 'Summer Sale', parent_id: 'sale', show_in_sidebar: true, sort_order: 1, badge: null, badge_color: null },
];

async function setup() {
  const client = await pool.connect();
  try {
    console.log('✅ Connected to Supabase database...');

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        show_in_sidebar BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        badge TEXT,
        badge_color TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ categories table created (or already existed)');

    // Enable RLS
    await client.query(`ALTER TABLE categories ENABLE ROW LEVEL SECURITY;`);

    // Drop existing policies if any, then recreate
    await client.query(`DROP POLICY IF EXISTS "Allow public read" ON categories;`);
    await client.query(`DROP POLICY IF EXISTS "Allow all write" ON categories;`);
    await client.query(`CREATE POLICY "Allow public read" ON categories FOR SELECT USING (true);`);
    await client.query(`CREATE POLICY "Allow all write" ON categories FOR ALL USING (true);`);
    console.log('✅ RLS policies set');

    // Add FK constraint (may fail if already exists, that's ok)
    try {
      await client.query(`
        ALTER TABLE categories 
        ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
      `);
    } catch (e) {
      // Already exists, ignore
    }

    // Check if already seeded
    const { rows } = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(rows[0].count) > 0) {
      console.log(`✅ Table already has ${rows[0].count} categories. Skipping seed.`);
    } else {
      // Insert top-level first
      const topLevel = DEFAULT_CATEGORIES.filter(c => !c.parent_id);
      for (const cat of topLevel) {
        await client.query(
          `INSERT INTO categories (id, name, parent_id, show_in_sidebar, sort_order, badge, badge_color) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
          [cat.id, cat.name, cat.parent_id, cat.show_in_sidebar, cat.sort_order, cat.badge, cat.badge_color]
        );
      }
      // Then children
      const children = DEFAULT_CATEGORIES.filter(c => c.parent_id);
      for (const cat of children) {
        await client.query(
          `INSERT INTO categories (id, name, parent_id, show_in_sidebar, sort_order, badge, badge_color) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
          [cat.id, cat.name, cat.parent_id, cat.show_in_sidebar, cat.sort_order, cat.badge, cat.badge_color]
        );
      }
      console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} default categories!`);
    }

    console.log('\n🎉 Done! categories table is ready in Supabase.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

setup();
