import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function updateImageUrls() {
  console.log('Fetching products to update URLs...');
  const { data: products, error } = await supabase.from('products').select('id, images');
  
  if (error) {
    console.error('Fetch error:', error);
    return;
  }
  
  let updatedCount = 0;
  
  for (const product of products) {
    if (!product.images || !Array.isArray(product.images)) continue;
    
    // Check if any URL contains the old domain
    const hasOldDomain = product.images.some(img => img.includes('f005.backblazeb2.com'));
    
    if (hasOldDomain) {
      // Replace the domain in all URLs that have it
      const newImages = product.images.map(img => 
        img.replace('https://f005.backblazeb2.com', 'https://images.zeerowear.com')
      );
      
      // Update the product in the database
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', product.id);
        
      if (updateError) {
        console.error(`Failed to update product ${product.id}:`, updateError);
      } else {
        console.log(`Updated product ${product.id}`);
        console.log(`  Old: ${product.images[0]}`); // logging first image as sample
        console.log(`  New: ${newImages[0]}`);
        updatedCount++;
      }
    }
  }
  
  console.log(`Migration complete! Successfully updated ${updatedCount} products.`);
}

updateImageUrls();
