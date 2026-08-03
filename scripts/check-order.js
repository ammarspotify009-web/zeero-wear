import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrder() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', 'ZW-MSAWC5OX')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Order Details:', JSON.stringify(data, null, 2));
  }
}

checkOrder();
