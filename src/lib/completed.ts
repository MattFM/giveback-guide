import { supabase } from './supabase';
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
  const auth: any = (supabase as any).auth;
  const maybe: any = auth.getUser ? await auth.getUser() : await auth.user();
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

// Additional helpers for dashboard and batch usage
export async function getCompletedCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_item_status')
      .select('item_id', { count: 'exact', head: true })
      .eq('is_completed', true);
    if (error) throw error;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function getRecentCompleted(limit = 10): Promise<Array<{ item_type: ItemType; item_id: string; completed_at: string }>> {
  try {
    const { data, error } = await supabase
      .from('user_item_status')
      .select('item_type,item_id,completed_at')
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as any;
  } catch {
    return [];
  }
}

export async function getStatusesForItems(pairs: Array<{ item_type: ItemType; item_id: string }>): Promise<Record<string, ItemStatus>> {
  const result: Record<string, ItemStatus> = {};
  if (!pairs || pairs.length === 0) return result;
  // Split queries by type to use simple IN filters
  const byType: Record<ItemType, string[]> = { project: [], stay: [] } as any;
  pairs.forEach(p => { const id = String(p.item_id); if (p.item_type === 'stay') byType.stay.push(id); else byType.project.push(id); });
  const queries: Promise<any>[] = [];
  if (byType.project.length) {
    const p = supabase
      .from('user_item_status')
      .select('item_type,item_id,is_completed,completed_at,completion_source')
      .eq('item_type', 'project')
      .in('item_id', byType.project)
      .then((res: any) => res);
    queries.push(Promise.resolve(p) as Promise<any>);
  }
  if (byType.stay.length) {
    const p = supabase
      .from('user_item_status')
      .select('item_type,item_id,is_completed,completed_at,completion_source')
      .eq('item_type', 'stay')
      .in('item_id', byType.stay)
      .then((res: any) => res);
    queries.push(Promise.resolve(p) as Promise<any>);
  }
  try {
    const results = await Promise.all(queries);
    results.forEach(r => {
      const rows = (r && r.data) ? r.data : [];
      (rows || []).forEach((row: any) => {
        result[`${row.item_type}:${String(row.item_id)}`] = row as ItemStatus;
      });
    });
  } catch {}
  return result;
}

export const api = { getStatus, setCompleted, getCompletedCount, getRecentCompleted, getStatusesForItems };