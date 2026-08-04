// Export Supabase data and import into PocketBase
import { createClient } from '@supabase/supabase-js';
import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PB_URL = process.env.PB_URL || 'https://pb.giveback.guide';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const pb = new PocketBase(PB_URL);

async function migrateTable(tableName, pbCollection, fieldMapping) {
  console.log(`\nMigrating ${tableName}...`);
  const { data: rows, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Supabase fetch error for ${tableName}:`, error);
    return { created: 0, failed: 0 };
  }
  if (!rows || rows.length === 0) {
    console.log(`No rows in ${tableName}`);
    return { created: 0, failed: 0 };
  }

  console.log(`Found ${rows.length} rows in ${tableName}`);

  let created = 0;
  let failed = 0;

  for (const row of rows) {
    const body = {};
    for (const [pbField, sbField] of Object.entries(fieldMapping)) {
      if (sbField === null) continue;
      let value = row[sbField];
      // Convert boolean strings to actual booleans if needed
      if (typeof value === 'boolean' || value === true || value === false) {
        body[pbField] = !!value;
      } else {
        body[pbField] = value;
      }
    }

    try {
      await pb.collection(pbCollection).create(body);
      created++;
    } catch (err) {
      console.error(`Failed to create ${tableName} row ${row.id}:`, err.message || err);
      if (err?.data) console.error('  Data:', JSON.stringify(err.data, null, 2));
      failed++;
    }
  }

  console.log(`${tableName} migration: Created ${created}, Failed ${failed}`);
  return { created, failed };
}

async function main() {
  await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
  console.log('PocketBase admin authenticated');

  // Migrate lists
  await migrateTable('lists', 'lists', {
    id: 'id',
    user: 'user_id',
    title: 'title',
    description: 'description',
    is_default: 'is_default',
    created_at: 'created_at'
  });

  // Migrate list_items
  await migrateTable('list_items', 'list_items', {
    id: 'id',
    list: 'list_id',
    item_type: 'item_type',
    item_id: 'item_id',
    added_at: 'added_at'
  });

  // Migrate user_item_status
  await migrateTable('user_item_status', 'user_item_status', {
    id: 'id',
    user: 'user_id',
    item_type: 'item_type',
    item_id: 'item_id',
    is_completed: 'is_completed',
    completed_at: 'completed_at',
    completion_source: 'completion_source',
    created_at: 'created_at',
    updated_at: 'updated_at'
  });

  console.log('\nAll data migrations complete!');
}

main().catch(console.error);
