import supabase from './supabase';

export type ItemType = 'project' | 'stay';

export type List = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  is_default: boolean;
  created_at: string;
};

export type ListItem = {
  id: string;
  list_id: string;
  item_type: ItemType;
  item_id: string;
  added_at: string;
};

export type ListWithItems = List & { items: ListItem[] };

async function getUserId(): Promise<string | null> {
  try {
    // Support both v2 and v1 SDK shapes
    const auth: any = (supabase as any).auth;
    const maybe: any = auth.getUser ? await auth.getUser() : await auth.user();
    const user = maybe?.data?.user || maybe?.user || null;
    return user?.id || null;
  } catch (e) {
    return null;
  }
}

// Get lists for the current user. If none exist, create a default list.
export async function getLists(): Promise<List[]> {
  try {
    const { data, error } = await supabase.from('lists').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
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
  // First get lists (RLS ensures only current user's lists)
  const { data: lists, error: listsErr } = await supabase
    .from('lists')
    .select('*')
    .order('created_at', { ascending: true });
  if (listsErr) throw listsErr;
  const listIds = (lists || []).map((l: any) => l.id);
  if (listIds.length === 0) return [] as any;

  const { data: items, error: itemsErr } = await supabase
    .from('list_items')
    .select('*')
    .in('list_id', listIds)
    .order('added_at', { ascending: false });
  if (itemsErr) throw itemsErr;

  const grouped: Record<string, ListItem[]> = {};
  (items || []).forEach((it: any) => {
    grouped[it.list_id] = grouped[it.list_id] || [];
    grouped[it.list_id].push(it as ListItem);
  });

  return (lists || []).map((l: any) => ({ ...(l as List), items: grouped[l.id] || [] }));
}

// Count helper for dashboard statistics
export async function getSavedCounts(): Promise<{ lists: number; items: number }>{
  const { data: lists, error: listsErr } = await supabase
    .from('lists')
    .select('id');
  if (listsErr) throw listsErr;
  const listIds = (lists || []).map((l: any) => l.id);
  if (listIds.length === 0) return { lists: 0, items: 0 };

  const { count, error: itemsErr } = await supabase
    .from('list_items')
    .select('id', { count: 'exact', head: true })
    .in('list_id', listIds);
  if (itemsErr) throw itemsErr;
  return { lists: listIds.length, items: count || 0 };
}

export async function createList(title: string, description?: string | null, makeDefault = false): Promise<List> {
  const user_id = await getUserId();
  if (!user_id) throw new Error('Not authenticated');

  const payload: any = { title, description: description ?? null, is_default: makeDefault, user_id };
  const { data, error } = await supabase.from('lists').insert([payload]).select('*').single();
  if (error) throw error;

  // If requested, unset default on other lists for this user
  if (makeDefault && data) {
    await supabase.from('lists').update({ is_default: false }).neq('id', data.id).eq('user_id', user_id);
  }

  return data as List;
}

export async function saveItemToList(listId: string, itemType: ItemType, itemId: string): Promise<ListItem> {
  const user_id = await getUserId();
  if (!user_id) throw new Error('Not authenticated');

  const payload = { list_id: listId, item_type: itemType, item_id: String(itemId) };
  // upsert expects an array of rows and a comma-separated onConflict string
  const { data, error } = await supabase.from('list_items').upsert([payload], { onConflict: 'list_id,item_type,item_id' }).select('*').single();
  if (error) throw error;
  return data as ListItem;
}

export async function removeItemFromList(listId: string, itemType: ItemType, itemId: string): Promise<boolean> {
  const { error } = await supabase.from('list_items').delete().match({ list_id: listId, item_type: itemType, item_id: String(itemId) });
  if (error) throw error;
  return true;
}

export async function deleteList(listId: string): Promise<boolean> {
  // Deleting the list will cascade delete its items due to FK ON DELETE CASCADE.
  const { error } = await supabase.from('lists').delete().eq('id', listId);
  if (error) throw error;
  return true;
}

export async function renameList(listId: string, title: string): Promise<List> {
  const { data, error } = await supabase
    .from('lists')
    .update({ title })
    .eq('id', listId)
    .select('*')
    .single();
  if (error) throw error;
  return data as List;
}

export async function setDefaultList(listId: string): Promise<boolean> {
  const user_id = await getUserId();
  if (!user_id) throw new Error('Not authenticated');

  // Set this list as default
  const { error: setErr } = await supabase.from('lists').update({ is_default: true }).eq('id', listId).eq('user_id', user_id);
  if (setErr) throw setErr;
  // Unset other lists for this user
  const { error: unsetErr } = await supabase.from('lists').update({ is_default: false }).neq('id', listId).eq('user_id', user_id);
  if (unsetErr) throw unsetErr;
  return true;
}

export async function getListsContainingItem(itemType: ItemType, itemId: string): Promise<List[]> {
  // Attempt to use a relationship select; if no foreign key relationship exists,
  // this will still return rows from list_items with nested 'lists' where available.
  const { data, error } = await supabase
    .from('list_items')
    .select('list_id, lists(id, title, description, is_default, user_id, created_at)')
    .eq('item_type', itemType)
    .eq('item_id', String(itemId));

  if (error) throw error;
  if (!data) return [];

  const lists = (data as any[]).map((r) => r.lists).filter(Boolean) as List[];
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
