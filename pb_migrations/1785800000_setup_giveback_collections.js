migrate((db) => {
  const dao = new Dao(db);

  // 1. Update users collection: add fields and enable OTP
  const users = dao.findCollectionByNameOrId("users");

  const hasName = users.fields.some((f) => f.name === "name");
  if (!hasName) {
    users.fields.push({
      name: "name",
      type: "text",
      required: false,
      options: { max: 200 },
    });
  }

  const hasPrefs = users.fields.some((f) => f.name === "prefs");
  if (!hasPrefs) {
    users.fields.push({
      name: "prefs",
      type: "json",
      required: false,
      options: {},
    });
  }

  users.otp = {
    enabled: true,
    duration: 300,
    length: 8,
    emailTemplate: {
      subject: "Your login link for Giveback Guide",
      body: 'Hello,\n\nClick here to log in: https://giveback.guide/account/verify?otpId={OTP_ID}&code={OTP}\n\nThis link will expire in 5 minutes. If you did not request this, please ignore it.\n\nThanks,\nThe Giveback Guide Team',
    },
  };

  dao.saveCollection(users);

  // 2. Create lists collection
  const listsExists = dao.findCollectionByNameOrId("lists");
  if (!listsExists) {
    const lists = new Collection({
      name: "lists",
      type: "base",
      fields: [
        {
          name: "user",
          type: "relation",
          required: true,
          options: {
            collectionId: users.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
        },
        {
          name: "title",
          type: "text",
          required: true,
          options: { max: 200 },
        },
        {
          name: "description",
          type: "text",
          required: false,
          options: { max: 500 },
        },
        {
          name: "is_default",
          type: "bool",
          required: false,
          options: {},
        },
        {
          name: "created_at",
          type: "autodate",
          required: false,
          options: { onCreate: true, onUpdate: false },
        },
      ],
      indexes: [
        'CREATE INDEX `idx_lists_user` ON `lists` (`user`)',
      ],
      listRule:
        '@request.auth.id != "" && user = @request.auth.id',
      viewRule:
        '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != ""',
      updateRule:
        '@request.auth.id != "" && user = @request.auth.id',
      deleteRule:
        '@request.auth.id != "" && user = @request.auth.id',
    });
    dao.saveCollection(lists);
  }

  // 3. Create list_items collection
  const listItemsExists = dao.findCollectionByNameOrId("list_items");
  if (!listItemsExists) {
    const listsCollection = dao.findCollectionByNameOrId("lists");
    const listItems = new Collection({
      name: "list_items",
      type: "base",
      fields: [
        {
          name: "list",
          type: "relation",
          required: true,
          options: {
            collectionId: listsCollection.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
        },
        {
          name: "item_type",
          type: "select",
          required: true,
          options: {
            maxSelect: 1,
            values: ["project", "stay"],
          },
        },
        {
          name: "item_id",
          type: "text",
          required: true,
          options: { max: 100 },
        },
        {
          name: "added_at",
          type: "autodate",
          required: false,
          options: { onCreate: true, onUpdate: false },
        },
      ],
      indexes: [
        'CREATE INDEX `idx_list_items_item` ON `list_items` (`item_type`, `item_id`)',
        'CREATE UNIQUE INDEX `idx_list_items_unique` ON `list_items` (`list`, `item_type`, `item_id`)',
      ],
      listRule:
        '@request.auth.id != "" && list.user = @request.auth.id',
      viewRule:
        '@request.auth.id != "" && list.user = @request.auth.id',
      createRule:
        '@request.auth.id != "" && list.user = @request.auth.id',
      updateRule:
        '@request.auth.id != "" && list.user = @request.auth.id',
      deleteRule:
        '@request.auth.id != "" && list.user = @request.auth.id',
    });
    dao.saveCollection(listItems);
  }

  // 4. Create user_item_status collection
  const statusExists = dao.findCollectionByNameOrId("user_item_status");
  if (!statusExists) {
    const status = new Collection({
      name: "user_item_status",
      type: "base",
      fields: [
        {
          name: "user",
          type: "relation",
          required: true,
          options: {
            collectionId: users.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
        },
        {
          name: "item_type",
          type: "select",
          required: true,
          options: {
            maxSelect: 1,
            values: ["project", "stay"],
          },
        },
        {
          name: "item_id",
          type: "text",
          required: true,
          options: { max: 100 },
        },
        {
          name: "is_completed",
          type: "bool",
          required: false,
          options: {},
        },
        {
          name: "completed_at",
          type: "date",
          required: false,
          options: {},
        },
        {
          name: "completion_source",
          type: "text",
          required: false,
          options: { max: 50 },
        },
        {
          name: "created_at",
          type: "autodate",
          required: false,
          options: { onCreate: true, onUpdate: false },
        },
        {
          name: "updated_at",
          type: "autodate",
          required: false,
          options: { onCreate: true, onUpdate: true },
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX `idx_user_item_status_pk` ON `user_item_status` (`user`, `item_type`, `item_id`)',
      ],
      listRule:
        '@request.auth.id != "" && user = @request.auth.id',
      viewRule:
        '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != ""',
      updateRule:
        '@request.auth.id != "" && user = @request.auth.id',
      deleteRule:
        '@request.auth.id != "" && user = @request.auth.id',
    });
    dao.saveCollection(status);
  }
}, (db) => {
  const dao = new Dao(db);

  // Rollback: delete collections in reverse dependency order
  try {
    dao.deleteCollectionByName("user_item_status");
  } catch (e) {
    console.log("user_item_status not found, skipping rollback");
  }

  try {
    dao.deleteCollectionByName("list_items");
  } catch (e) {
    console.log("list_items not found, skipping rollback");
  }

  try {
    dao.deleteCollectionByName("lists");
  } catch (e) {
    console.log("lists not found, skipping rollback");
  }

  // Disable OTP on users (preserve custom fields to avoid data loss)
  try {
    const users = dao.findCollectionByNameOrId("users");
    users.otp = { enabled: false };
    dao.saveCollection(users);
  } catch (e) {
    console.log("Could not update users collection in rollback");
  }
});
