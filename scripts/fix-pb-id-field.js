// Fix id field max length on multiple collections to accept UUIDs
import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config();

const PB_URL = process.env.PB_URL || 'https://pb.giveback.guide';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

const pb = new PocketBase(PB_URL);

async function fixCollection(name) {
  const collection = await pb.collections.getOne(name);
  const idField = collection.fields.find(f => f.name === 'id');

  if (!idField) {
    console.log(`[${name}] id field not found`);
    return;
  }

  if (idField.max >= 36 && idField.min === 0) {
    console.log(`[${name}] Already fixed`);
    return;
  }

  console.log(`[${name}] Fixing id field (current max=${idField.max}, min=${idField.min})`);
  idField.max = 36;
  idField.min = 0;
  if (idField.pattern) idField.pattern = '^[a-zA-Z0-9-]+$';
  if (idField.autogeneratePattern) delete idField.autogeneratePattern;

  await pb.collections.update(collection.id, collection);
  console.log(`[${name}] Updated successfully`);
}

async function main() {
  await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
  console.log('Admin authenticated\n');

  await fixCollection('lists');
  await fixCollection('list_items');
  await fixCollection('user_item_status');
}

main().catch(console.error);
