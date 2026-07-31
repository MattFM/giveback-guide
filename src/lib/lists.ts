import { pb } from './pocketbase';

export type ItemType = 'project' | 'stay';

export type List = {
  id: string;
  user: string;
  title: string;
  description?: string | null;
  is_default: boolean;
  created_at: string;
};

export type ListItem = {
  id: string;
  list: string;
  item_type: ItemType;
  item_id: string;
  added_at: string;
};

export type ListWithItems = List & { items: ListItem[] };

async function getUserId(): Promise<string | null> {
  try {
    const pbClient = pb();
    const record = pbClient.authStore.record;
    return record?.id || null;
  } catch {
    return null;
  }
}

// Get lists for the current user. If none exist, create a default list.
export async function getLists(): Promise<List[]> {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const pbClient = pb();
    const result = await pbClient.collection('lists').getList(1, 100, {
      filter: `user = "${userId}"`,
      sort: 'created_at'
    });
    
    const data = result.items.map(item => ({
      id: item.id,
      user: item.user,
      title: item.title,
      description: item.description || null,
      is_default: !!item.is_default,
      created_at: item.created_at,
    })) as List[];
    
    if (data.length === 0) {
      // create default list
      const defaultTitle = 'Saved';
      const created = await createList(defaultTitle, 'Default saved items', true);
      return created ? [created] : [];
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// Fetch lists with their items for the current user.
export async function getListsWithItems(): Promise<ListWithItems[]> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');
  
  const pbClient = pb();
  
  // First get lists
  const listsResult = await pbClient.collection('lists').getList(1, 100, {
    filter: `user = "${userId}"`,
    sort: 'created_at'
  });
  const lists = (listsResult.items || []).map((item: any) => ({
    id: item.id,
    user: item.user,
    title: item.title,
    description: item.description || null,
    is_default: !!item.is_default,
    created_at: item.created_at,
  })) as List[];
  
  const listIds = lists.map((l: any) => l.id);
  if (listIds.length === 0) return [] as any;

  // Build filter for items: list = "ID1" || list = "ID2" || ...
  const listFilter = listIds.map((id: string) => `list = "${id}"`).join(' || ');
  const itemsResult = await pbClient.collection('list_items').getList(1, 500, {
    filter: listFilter,
    sort: '-added_at'
  });
  const items = (itemsResult.items || []).map((item: any) => ({
    id: item.id,
    list: item.list,
    item_type: item.item_type,
    item_id: item.item_id,
    added_at: item.added_at,
  })) as ListItem[];

  const grouped: Record<string, ListItem[]> = {};
  items.forEach((it: any) => {
    grouped[it.list] = grouped[it.list] || [];
    grouped[it.list].push(it as ListItem);
  });

  return lists.map((l: any) => ({ ...(l as List), items: grouped[l.id] || [] }));
}

// Count helper for dashboard statistics
export async function getSavedCounts(): Promise<{ lists: number; items: number }>{
  const userId = await getUserId();
  if (!userId) return { lists: 0, items: 0 };
  
  const pbClient = pb();
  
  const listsResult = await pbClient.collection('lists').getList(1, 100, {
    filter: `user = "${userId}"`,
    fields: 'id'
  });
  const listIds = (listsResult.items || []).map((l: any) => l.id);
  if (listIds.length === 0) return { lists: 0, items: 0 };

  const listFilter = listIds.map((id: string) => `list = "${id}"`).join(' || ');
  const itemsResult = await pbClient.collection('list_items').getList(1, 1, {
    filter: listFilter,
    fields: 'id'
  });
  
  return { lists: listIds.length, items: itemsResult.totalItems || 0 };
}

export async function createList(title: string, description?: string | null, makeDefault = false): Promise<List> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const pbClient = pb();
  const payload = { user: userId, title, description: description ?? null, is_default: makeDefault };
  const record = await pbClient.collection('lists').create(payload);

  // If requested, unset default on other lists for this user
  if (makeDefault) {
    const otherLists = await pbClient.collection('lists').getList(1, 100, {
      filter: `user = "${userId}" && id != "${record.id}"`
    });
    for (const other of otherLists.items) {
      await pbClient.collection('lists').update(other.id, { is_default: false });
    }
  }

  return {
    id: record.id,
    user: record.user,
    title: record.title,
    description: record.description || null,
    is_default: !!record.is_default,
    created_at: record.created_at,
  } as List;
}

export async function saveItemToList(listId: string, itemType: ItemType, itemId: string): Promise<ListItem> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const pbClient = pb();
  
  // Check if item already exists (upsert behaviour)
  try {
    const existing = await pbClient.collection('list_items').getFirstListItem({
      filter: `list = "${listId}" && item_type = "${itemType}" && item_id = "${itemId}"`
    });
    // Already exists, return it
    return {
      id: existing.id,
      list: existing.list,
      item_type: existing.item_type,
      item_id: existing.item_id,
      added_at: existing.added_at,
    } as ListItem;
  } catch (e) {
    // Not found - create new
  }

  const record = await pbClient.collection('list_items').create({
    list: listId,
    item_type: itemType,
    item_id: String(itemId),
  });
  
  return {
    id: record.id,
    list: record.list,
    item_type: record.item_type,
    item_id: record.item_id,
    added_at: record.added_at,
  } as ListItem;
}

export async function removeItemFromList(listId: string, itemType: ItemType, itemId: string): Promise<boolean> {
  const pbClient = pb();
  
  // Find the item record first
  try {
    const existing = await pbClient.collection('list_items').getFirstListItem({
      filter: `list = "${listId}" && item_type = "${itemType}" && item_id = "${itemId}"`
    });
    await pbClient.collection('list_items').delete(existing.id);
    return true;
  } catch (e) {
    // Not found - nothing to delete
    return true;
  }
}

export async function deleteList(listId: string): Promise<boolean> {
  const pbClient = pb();
  await pbClient.collection('lists').delete(listId);
  // Items cascade delete via collection relation setting
  return true;
}

export async function renameList(listId: string, title: string): Promise<List> {
  const pbClient = pb();
  const record = await pbClient.collection('lists').update(listId, { title });
  return {
    id: record.id,
    user: record.user,
    title: record.title,
    description: record.description || null,
    is_default: !!record.is_default,
    created_at: record.created_at,
  } as List;
}

export async function setDefaultList(listId: string): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const pbClient = pb();
  
  // Set this list as default
  await pbClient.collection('lists').update(listId, { is_default: true });
  
  // Unset other lists for this user
  const otherLists = await pbClient.collection('lists').getList(1, 100, {
    filter: `user = "${userId}" && id != "${listId}"`
  });
  for (const other of otherLists.items) {
    await pbClient.collection('lists').update(other.id, { is_default: false });
  }
  
  return true;
}

export async function getListsContainingItem(itemType: ItemType, itemId: string): Promise<List[]> {
  const pbClient = pb();
  
  // Get items matching the type and id, expanding the list relation
  const itemsResult = await pbClient.collection('list_items').getList(1, 100, {
    filter: `item_type = "${itemType}" && item_id = "${String(itemId)}"`,
    expand: 'list'
  });
  
  if (!itemsResult.items || itemsResult.items.length === 0) return [];

  // Extract lists from expanded relation
  const lists = (itemsResult.items as any[])
    .map((r: any) => r.expand?.list)
    .filter(Boolean)
    .map((l: any) => ({
      id: l.id,
      user: l.user,
      title: l.title,
      description: l.description || null,
      is_default: !!l.is_default,
      created_at: l.created_at,
    })) as List[];
  
  return lists;
}

export default {
  getLists,
  getListsWithItems,
  getSavedCounts,
  createList,
  saveItemToList,
  removeItemFromList,
  deleteList,
  renameList,
  setDefaultList,
  getListsContainingItem,
};
