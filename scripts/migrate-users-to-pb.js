// Bulk-import users from Supabase to Pocketbase, preserving original UUIDs.
// Run with: node scripts/migrate-users-to-pb.js
// Requires the following environment variables (set in .env or exported):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD

import { createClient } from '@supabase/supabase-js';
import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PB_URL = process.env.PB_URL || 'https://pb.giveback.guide';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}
if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error('Please set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const pb = new PocketBase(PB_URL);

async function migrate() {
  try {
    console.log('Authenticating with Pocketbase admin...');
    await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    console.log('Admin authenticated\n');

    console.log('Fetching users from Supabase...');
    const { data: users, error } = await supabase.auth.admin.listUsers({
      perPage: 1000,
      page: 1
    });

    if (error) {
      console.error('Supabase fetch error:', error);
      process.exit(1);
    }

    if (!users || !users.users || users.users.length === 0) {
      console.log('No users found in Supabase');
      process.exit(0);
    }

    console.log(`Found ${users.users.length} users in Supabase\n`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users.users) {
      const email = user.email;
      const id = user.id;
      const metadata = user.user_metadata || {};
      const name = metadata.name || metadata.full_name || '';
      const prefs = metadata.prefs || metadata.preferences || {};

      if (!email) {
        console.warn(`Skipping user ${id}: no email address`);
        skipped++;
        continue;
      }

      try {
        // Check if user already exists in PB
        try {
          await pb.collection('users').getOne(id);
          console.log(`User already exists: ${email} (${id})`);
          skipped++;
          continue;
        } catch (e) {
          // Not found — proceed to create
        }

        // Create user with the exact same UUID
        // Auth collections require password even when password auth is disabled
        const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        await pb.send('/api/collections/users/records', {
          method: 'POST',
          body: {
            id: id,
            email: email,
            emailVisibility: true,
            verified: true,
            password: randomPassword,
            passwordConfirm: randomPassword,
            name: name,
            prefs: prefs
          }
        });

        console.log(`Created: ${email} (${id})`);
        created++;
      } catch (err) {
        console.error(`Failed to create ${email}:`, err.message || err);
        if (err?.data) console.error('  Error data:', JSON.stringify(err.data, null, 2));
        if (err?.response) console.error('  Response:', JSON.stringify(err.response, null, 2));
        failed++;
      }
    }

    console.log(`\nMigration complete:`);
    console.log(`  Created: ${created}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Failed:  ${failed}`);

    if (failed > 0) {
      process.exit(1);
    }

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
