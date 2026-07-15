import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://pgefuifzakvratosuqoy.supabase.co", "sb_publishable_XMIkb8rvR3mnG999oormLA_QTFYi2o4");
async function check() {
  const { data, error } = await supabase.from("orders").select("*");
  console.log("Data:", data);
  console.log("Error:", error);
}
check();
