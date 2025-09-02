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

async function getUserId(): Promise<string | null> {
  try {
    // Support both v2 and v1 SDK shapes
    const maybe: any = supabase.auth.getUser ? await supabase.auth.getUser() : await (supabase.auth as any).user();
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
  createList,
  saveItemToList,
  removeItemFromList,
  getListsContainingItem,
};
