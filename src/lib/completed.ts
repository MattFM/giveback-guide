import supabase from './supabase';
import type { ItemType } from './lists';

export type ItemStatus = {
  item_type: ItemType;
  item_id: string;
  is_completed: boolean;
  completed_at: string | null;
  completion_source?: string | null;
};

async function getUserId(): Promise<string | null> {
  try {
    const maybe: any = supabase.auth.getUser ? await supabase.auth.getUser() : await (supabase.auth as any).user();
    const user = maybe?.data?.user || maybe?.user || null;
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function getStatus(itemType: ItemType, itemId: string): Promise<ItemStatus | null> {
  try {
    const { data, error } = await supabase
      .from('user_item_status')
      .select('item_type,item_id,is_completed,completed_at,completion_source')
      .eq('item_type', itemType)
      .eq('item_id', String(itemId))
      .maybeSingle();
    if (error) throw error;
    return data as any as ItemStatus | null;
  } catch (e) {
    // Table may not exist yet; return null silently
    return null;
  }
}

export async function setCompleted(itemType: ItemType, itemId: string, to: boolean, source: string = 'manual'): Promise<ItemStatus | null> {
  try {
    const user_id = await getUserId();
    if (!user_id) throw new Error('Not authenticated');
    const payload: any = {
      user_id,
      item_type: itemType,
      item_id: String(itemId),
      is_completed: !!to,
      completed_at: to ? new Date().toISOString() : null,
      completion_source: to ? source : null,
    };
    const { data, error } = await supabase
      .from('user_item_status')
      .upsert([payload], { onConflict: 'user_id,item_type,item_id' })
      .select('item_type,item_id,is_completed,completed_at,completion_source')
      .single();
    if (error) throw error;
    return data as any as ItemStatus;
  } catch (e) {
    return null;
  }
}

export default { getStatus, setCompleted };