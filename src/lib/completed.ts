import { pb, getCurrentUser } from './pocketbase';
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
    const user = await getCurrentUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function getStatus(itemType: ItemType, itemId: string): Promise<ItemStatus | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;
    
    const pbClient = pb();
    const record = await pbClient.collection('user_item_status').getFirstListItem(
      `user = "${userId}" && item_type = "${itemType}" && item_id = "${String(itemId)}"`
    );
    
    return {
      item_type: record.item_type,
      item_id: record.item_id,
      is_completed: !!record.is_completed,
      completed_at: record.completed_at || null,
      completion_source: record.completion_source || null,
    } as ItemStatus;
  } catch (e) {
    // Record may not exist
    return null;
  }
}

export async function setCompleted(itemType: ItemType, itemId: string, to: boolean, source: string = 'manual'): Promise<ItemStatus | null> {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const pbClient = pb();
    const payload: any = {
      user: userId,
      item_type: itemType,
      item_id: String(itemId),
      is_completed: !!to,
      completed_at: to ? new Date().toISOString() : null,
      completion_source: to ? source : null,
    };
    
    // Check if record exists first (upsert behaviour)
    try {
      const existing = await pbClient.collection('user_item_status').getFirstListItem(
        `user = "${userId}" && item_type = "${itemType}" && item_id = "${String(itemId)}"`
      );
      
      // Update existing
      const record = await pbClient.collection('user_item_status').update(existing.id, payload);
      return {
        item_type: record.item_type,
        item_id: record.item_id,
        is_completed: !!record.is_completed,
        completed_at: record.completed_at || null,
        completion_source: record.completion_source || null,
      } as ItemStatus;
    } catch (e) {
      // Not found - create new
      const record = await pbClient.collection('user_item_status').create(payload);
      return {
        item_type: record.item_type,
        item_id: record.item_id,
        is_completed: !!record.is_completed,
        completed_at: record.completed_at || null,
        completion_source: record.completion_source || null,
      } as ItemStatus;
    }
  } catch (e) {
    return null;
  }
}

export default { getStatus, setCompleted };

// Additional helpers for dashboard and batch usage
export async function getCompletedCount(): Promise<number> {
  try {
    const userId = await getUserId();
    if (!userId) return 0;
    
    const pbClient = pb();
    const result = await pbClient.collection('user_item_status').getList(1, 1, {
      filter: `user = "${userId}" && is_completed = true`,
      fields: 'id'
    });
    return result.totalItems || 0;
  } catch {
    return 0;
  }
}

export async function getRecentCompleted(limit = 10): Promise<Array<{ item_type: ItemType; item_id: string; completed_at: string }>> {
  try {
    const userId = await getUserId();
    if (!userId) return [];
    
    const pbClient = pb();
    const result = await pbClient.collection('user_item_status').getList(1, limit, {
      filter: `user = "${userId}" && is_completed = true`,
      sort: '-completed_at',
      fields: 'item_type,item_id,completed_at'
    });
    return (result.items || []).map((row: any) => ({
      item_type: row.item_type,
      item_id: row.item_id,
      completed_at: row.completed_at,
    })) as any;
  } catch {
    return [];
  }
}

export async function getStatusesForItems(pairs: Array<{ item_type: ItemType; item_id: string }>): Promise<Record<string, ItemStatus>> {
  const result: Record<string, ItemStatus> = {};
  if (!pairs || pairs.length === 0) return result;
  
  const userId = await getUserId();
  if (!userId) return result;
  
  // Split queries by type
  const byType: Record<ItemType, string[]> = { project: [], stay: [] } as any;
  pairs.forEach(p => { 
    const id = String(p.item_id); 
    if (p.item_type === 'stay') byType.stay.push(id); 
    else byType.project.push(id); 
  });
  
  const pbClient = pb();
  const queries: Promise<any>[] = [];
  
  if (byType.project.length) {
    const idFilter = byType.project.map((id: string) => `item_id = "${id}"`).join(' || ');
    queries.push(
      pbClient.collection('user_item_status').getList(1, 500, {
        filter: `user = "${userId}" && item_type = "project" && (${idFilter})`,
        fields: 'item_type,item_id,is_completed,completed_at,completion_source',
        $autoCancel: false,
      }).then(res => res.items)
    );
  }
  if (byType.stay.length) {
    const idFilter = byType.stay.map((id: string) => `item_id = "${id}"`).join(' || ');
    queries.push(
      pbClient.collection('user_item_status').getList(1, 500, {
        filter: `user = "${userId}" && item_type = "stay" && (${idFilter})`,
        fields: 'item_type,item_id,is_completed,completed_at,completion_source',
        $autoCancel: false,
      }).then(res => res.items)
    );
  }

  try {
    const results = await Promise.all(queries);
    results.forEach(rows => {
      (rows || []).forEach((row: any) => {
        result[`${row.item_type}:${String(row.item_id)}`] = row as ItemStatus;
      });
    });
  } catch (err: any) {
    console.error('[getStatusesForItems] Failed to load statuses:', err);
  }
  return result;
}

export const api = { getStatus, setCompleted, getCompletedCount, getRecentCompleted, getStatusesForItems };
