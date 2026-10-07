import { initAdminAuth } from './pocketbase';

export interface Slice {
  label: string;
  min: number;
  max: number;
}

export const LIST_SLICES: Slice[] = [
  { label: '0', min: 0, max: 0 },
  { label: '1', min: 1, max: 1 },
  { label: '2', min: 2, max: 2 },
  { label: '3', min: 3, max: 3 },
  { label: '4', min: 4, max: 4 },
  { label: '5+', min: 5, max: Number.MAX_SAFE_INTEGER },
];

export const SAVE_SLICES: Slice[] = [
  { label: '0-9', min: 0, max: 9 },
  { label: '10-49', min: 10, max: 49 },
  { label: '50-99', min: 50, max: 99 },
  { label: '100+', min: 100, max: Number.MAX_SAFE_INTEGER },
];

export const VISIT_SLICES: Slice[] = [
  { label: '0', min: 0, max: 0 },
  { label: '1-9', min: 1, max: 9 },
  { label: '10+', min: 10, max: Number.MAX_SAFE_INTEGER },
];

export interface Counts {
  total: number;
}

export interface Distribution {
  buckets: Record<string, number>;
  p50: number;
  p75: number;
  p90: number;
  p99: number;
  max: number;
  mean: number;
  totalUsersWithAtLeastOne: number;
}

export interface Funnel {
  signedUp: number;
  completedName: number;
  optedNewsletter: number;
  savedFirstItem: number;
  markedFirstVisit: number;
}

function bucketize(values: number[], slices: Slice[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of slices) out[s.label] = 0;
  for (const v of values) {
    const match = slices.find((s) => v >= s.min && v <= s.max);
    if (!match) continue;
    out[match.label]++;
  }
  return out;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function summarize(
  perUserCounts: Record<string, number>,
  totalUsers: number,
  slices: Slice[]
): Distribution {
  const usersWithAtLeastOne = Object.values(perUserCounts);
  const zeros = Math.max(0, totalUsers - usersWithAtLeastOne.length);
  const all: number[] = [];
  for (let i = 0; i < zeros; i++) all.push(0);
  all.push(...usersWithAtLeastOne);
  const sum = all.reduce((acc, v) => acc + v, 0);
  return {
    buckets: bucketize(all, slices),
    p50: percentile(all, 50),
    p75: percentile(all, 75),
    p90: percentile(all, 90),
    p99: percentile(all, 99),
    max: all.length === 0 ? 0 : Math.max(...all),
    mean: all.length === 0 ? 0 : sum / all.length,
    totalUsersWithAtLeastOne: usersWithAtLeastOne.length,
  };
}

async function fetchAll(collection: string): Promise<any[]> {
  const pb = await initAdminAuth();
  return await pb.collection(collection).getFullList({ batch: 500 });
}

async function fetchCount(collection: string): Promise<number> {
  const pb = await initAdminAuth();
  const res = await pb.collection(collection).getList(1, 1);
  return res.totalItems;
}

export async function getUserCounts(): Promise<Counts> {
  return { total: await fetchCount('users') };
}

export async function getListCount(): Promise<Counts> {
  return { total: await fetchCount('lists') };
}

export async function getSaveCount(): Promise<Counts> {
  return { total: await fetchCount('list_items') };
}

export async function getListsDistribution(): Promise<Distribution> {
  const [totalUsers, allLists] = await Promise.all([
    fetchCount('users'),
    fetchAll('lists'),
  ]);
  const perUser: Record<string, number> = {};
  for (const list of allLists) {
    const u = list.user as string;
    perUser[u] = (perUser[u] ?? 0) + 1;
  }
  return summarize(perUser, totalUsers, LIST_SLICES);
}

export async function getSavesDistribution(): Promise<Distribution> {
  const [totalUsers, allItems, allLists] = await Promise.all([
    fetchCount('users'),
    fetchAll('list_items'),
    fetchAll('lists'),
  ]);
  const userByList: Record<string, string> = {};
  for (const list of allLists) userByList[list.id] = list.user;
  const perUser: Record<string, number> = {};
  for (const item of allItems) {
    const u = userByList[item.list];
    if (!u) continue;
    perUser[u] = (perUser[u] ?? 0) + 1;
  }
  return summarize(perUser, totalUsers, SAVE_SLICES);
}

export async function getVisitsDistribution(): Promise<Distribution> {
  const [totalUsers, allStatuses] = await Promise.all([
    fetchCount('users'),
    fetchAll('user_item_status'),
  ]);
  const perUser: Record<string, number> = {};
  for (const status of allStatuses) {
    const u = status.user as string | undefined;
    if (!u) continue;
    perUser[u] = (perUser[u] ?? 0) + 1;
  }
  return summarize(perUser, totalUsers, VISIT_SLICES);
}

export async function getOnboardingFunnel(): Promise<Funnel> {
  const [allUsers, allLists, allItems, allStatuses] = await Promise.all([
    fetchAll('users'),
    fetchAll('lists'),
    fetchAll('list_items'),
    fetchAll('user_item_status'),
  ]);
  const userByList: Record<string, string> = {};
  for (const list of allLists) userByList[list.id] = list.user;
  const usersWhoSaved = new Set<string>();
  for (const item of allItems) {
    const u = userByList[item.list];
    if (u) usersWhoSaved.add(u);
  }
  const usersWhoVisited = new Set<string>();
  for (const status of allStatuses) {
    const u = status.user as string | undefined;
    if (u) usersWhoVisited.add(u);
  }
  let completedName = 0;
  let optedNewsletter = 0;
  for (const u of allUsers) {
    const name = typeof u.name === 'string' ? u.name.trim() : '';
    if (name.length > 0) completedName++;
    const prefs = u.prefs ?? {};
    if (prefs.newsletter === true) optedNewsletter++;
  }
  return {
    signedUp: allUsers.length,
    completedName,
    optedNewsletter,
    savedFirstItem: usersWhoSaved.size,
    markedFirstVisit: usersWhoVisited.size,
  };
}
