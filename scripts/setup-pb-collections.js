// One-time setup script for Pocketbase collections.
// Run with: node scripts/setup-pb-collections.js
// Requires: PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD, and PB_URL in your .env file
// Or pass them as environment variables.

import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config();

const PB_URL = process.env.PB_URL || 'https://pb.giveback.guide';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error('Please set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables');
  process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function setup() {
  try {
    console.log('Authenticating as admin...');
    await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    console.log('Admin authenticated');

    // 1. Update the users collection to add custom fields and enable OTP
    console.log('Configuring users collection...');
    const usersCollection = await pb.collection('users').getOne('users');
    
    // Update users collection schema
    const updatedUsers = {
      ...usersCollection,
      fields: [
        ...(usersCollection.fields || []),
        {
          name: 'name',
          type: 'text',
          required: false,
          options: { max: 200 }
        },
        {
          name: 'prefs',
          type: 'json',
          required: false,
          options: {}
        }
      ],
      otp: {
        enabled: true,
        duration: 300, // 5 minutes
        length: 8,
        emailTemplate: {
          subject: 'Your login link for Giveback Guide',
          body: `Hello,

Click here to log in: https://giveback.guide/account/verify?otpId={OTP_ID}&code={OTP}

This link will expire in 5 minutes. If you didn't request this, please ignore it.

Thanks,
The Giveback Guide Team`
        }
      }
    };

    await pb.send('/api/collections/users', {
      method: 'PATCH',
      body: updatedUsers
    });
    console.log('Users collection updated');

    // 2. Create lists collection
    console.log('Creating lists collection...');
    await pb.send('/api/collections', {
      method: 'POST',
      body: {
        name: 'lists',
        type: 'base',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'users',
              maxSelect: 1,
              cascadeDelete: false
            }
          },
          {
            name: 'title',
            type: 'text',
            required: true,
            options: { max: 200 }
          },
          {
            name: 'description',
            type: 'text',
            required: false,
            options: { max: 500 }
          },
          {
            name: 'is_default',
            type: 'bool',
            required: false,
            options: {}
          },
          {
            name: 'created_at',
            type: 'autodate',
            required: false,
            options: { onCreate: true, onUpdate: false }
          }
        ],
        indexes: [
          'CREATE INDEX `idx_lists_user` ON `lists` (`user`)'
        ],
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id'
      }
    });
    console.log('lists collection created');

    // 3. Create list_items collection
    console.log('Creating list_items collection...');
    await pb.send('/api/collections', {
      method: 'POST',
      body: {
        name: 'list_items',
        type: 'base',
        fields: [
          {
            name: 'list',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'lists',
              maxSelect: 1,
              cascadeDelete: true
            }
          },
          {
            name: 'item_type',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['project', 'stay']
            }
          },
          {
            name: 'item_id',
            type: 'text',
            required: true,
            options: { max: 100 }
          },
          {
            name: 'added_at',
            type: 'autodate',
            required: false,
            options: { onCreate: true, onUpdate: false }
          }
        ],
        indexes: [
          'CREATE INDEX `idx_list_items_item` ON `list_items` (`item_type`, `item_id`)',
          'CREATE UNIQUE INDEX `idx_list_items_unique` ON `list_items` (`list`, `item_type`, `item_id`)'
        ],
        listRule: '@request.auth.id != "" && list.user = @request.auth.id',
        viewRule: '@request.auth.id != "" && list.user = @request.auth.id',
        createRule: '@request.auth.id != "" && list.user = @request.auth.id',
        updateRule: '@request.auth.id != "" && list.user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && list.user = @request.auth.id'
      }
    });
    console.log('list_items collection created');

    // 4. Create user_item_status collection
    console.log('Creating user_item_status collection...');
    await pb.send('/api/collections', {
      method: 'POST',
      body: {
        name: 'user_item_status',
        type: 'base',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'users',
              maxSelect: 1,
              cascadeDelete: true
            }
          },
          {
            name: 'item_type',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['project', 'stay']
            }
          },
          {
            name: 'item_id',
            type: 'text',
            required: true,
            options: { max: 100 }
          },
          {
            name: 'is_completed',
            type: 'bool',
            required: false,
            options: {}
          },
          {
            name: 'completed_at',
            type: 'date',
            required: false,
            options: {}
          },
          {
            name: 'completion_source',
            type: 'text',
            required: false,
            options: { max: 50 }
          },
          {
            name: 'created_at',
            type: 'autodate',
            required: false,
            options: { onCreate: true, onUpdate: false }
          },
          {
            name: 'updated_at',
            type: 'autodate',
            required: false,
            options: { onCreate: true, onUpdate: true }
          }
        ],
        indexes: [
          'CREATE UNIQUE INDEX `idx_user_item_status_pk` ON `user_item_status` (`user`, `item_type`, `item_id`)'
        ],
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id'
      }
    });
    console.log('user_item_status collection created');

    console.log('\nSetup complete! All collections configured.');
    console.log('Next steps:');
    console.log('1. Configure SMTP in Pocketbase admin UI (Settings > Mail Settings)');
    console.log('2. Configure CORS (Settings > CORS) with your production domain');
    console.log('3. Test OTP authentication from the login page');

  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
