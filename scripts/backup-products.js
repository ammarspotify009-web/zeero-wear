import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function backupProducts() {
  console.log('Fetching all products for backup...');
  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error('Fetch error:', error);
    return;
  }
  
  const backupPath = path.join(process.cwd(), 'products_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(products, null, 2));
  console.log(`Backup completed successfully! Saved ${products.length} products to products_backup.json`);
}

backupProducts();
