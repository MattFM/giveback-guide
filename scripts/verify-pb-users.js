// Quick script to verify all users were migrated correctly
import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config();

const PB_URL = process.env.PB_URL || 'https://pb.giveback.guide';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

const pb = new PocketBase(PB_URL);

async function verify() {
  await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
  const users = await pb.collection('users').getFullList({ sort: 'created' });
  console.log(`Total users in PocketBase: ${users.length}`);
  const uuids = users.filter(u => u.id.includes('-'));
  console.log(`Users with UUID format: ${uuids.length}`);
  if (users.length > 0) {
    console.log('First user:', users[0].email, users[0].id);
    console.log('Last user:', users[users.length - 1].email, users[users.length - 1].id);
  }
}

verify().catch(console.error);
