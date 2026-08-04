// Debug: inspect Supabase user_item_status schema
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inspect() {
  const { data: rows, error } = await supabase.from('user_item_status').select('*').limit(3);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Columns:', Object.keys(rows[0] || {}));
  console.log('First row:', JSON.stringify(rows[0], null, 2));
}

inspect();
