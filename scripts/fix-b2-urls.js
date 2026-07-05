import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixBrokenUrls() {
  const { data: products, error } = await supabase.from('products').select('id, images');
  if (error) { console.error('Fetch error:', error); return; }

  let fixed = 0;
  for (const product of products) {
    if (!product.images) continue;

    const hasBreaking = product.images.some(img => img.includes('s3.us-east-005.backblazeb2.com'));
    if (!hasBreaking) continue;

    const correctedImages = product.images.map(img =>
      img.replace('https://zeero-kid-image.s3.us-east-005.backblazeb2.com', 'https://images.zeerowear.com/file/zeero-kid-image')
    );

    const { error: updateError } = await supabase
      .from('products')
      .update({ images: correctedImages })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Failed to fix product ${product.id}:`, updateError);
    } else {
      console.log(`Fixed product ${product.id}:`, correctedImages);
      fixed++;
    }
  }

  console.log(`\nDone! Fixed ${fixed} product(s).`);
}

fixBrokenUrls();
