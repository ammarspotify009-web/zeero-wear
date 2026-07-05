import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function clearDummyProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) { console.error('Fetch error:', error); return; }
  
  const toDelete = data.filter(p => p.images && p.images.some(img => img.includes('hipkids.pk')));
  
  console.log(`Found ${toDelete.length} dummy products to delete.`);
  for (const p of toDelete) {
    const { error: delErr } = await supabase.from('products').delete().eq('id', p.id);
    if (delErr) {
      console.error(`Failed to delete ${p.id}:`, delErr);
    } else {
      console.log(`Deleted ${p.id}`);
    }
  }
  console.log('Cleanup complete!');
}

clearDummyProducts();
