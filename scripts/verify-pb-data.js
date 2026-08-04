// Verify data counts in PocketBase
import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config();

const PB_URL = process.env.PB_URL || 'https://pb.giveback.guide';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

const pb = new PocketBase(PB_URL);

async function verify() {
  await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);

  for (const name of ['lists', 'list_items', 'user_item_status']) {
    try {
      const items = await pb.collection(name).getFullList();
      console.log(`${name}: ${items.length} records`);
    } catch (e) {
      console.error(`${name}: error -`, e.message);
    }
  }
}

verify().catch(console.error);
