export type Tier = 'free' | 'pro';

export const FREE_TIER = {
  maxLists: 3,
  maxSaves: 100,
} as const;

export interface TierStatus {
  tier: Tier;
  maxLists: number;
  maxSaves: number;
  perks: string[];
}

export function getTierStatus(tier: Tier): TierStatus {
  if (tier === 'pro') {
    return {
      tier: 'pro',
      maxLists: Number.POSITIVE_INFINITY,
      maxSaves: Number.POSITIVE_INFINITY,
      perks: ['unlimited lists', 'unlimited saves', 'maps when shipped'],
    };
  }
  return {
    tier: 'free',
    maxLists: FREE_TIER.maxLists,
    maxSaves: FREE_TIER.maxSaves,
    perks: ['saving + tracking core features'],
  };
}

export type LimitReason = 'list-limit' | 'save-limit';

export interface LimitResult {
  allowed: boolean;
  reason?: LimitReason;
}

export function canCreateList(listCount: number, tier: Tier): LimitResult {
  if (tier === 'pro') return { allowed: true };
  return listCount < FREE_TIER.maxLists
    ? { allowed: true }
    : { allowed: false, reason: 'list-limit' };
}

export function canSaveItem(totalSavedCount: number, tier: Tier): LimitResult {
  if (tier === 'pro') return { allowed: true };
  return totalSavedCount < FREE_TIER.maxSaves
    ? { allowed: true }
    : { allowed: false, reason: 'save-limit' };
}

export function getRemainingLists(listCount: number, tier: Tier): number {
  if (tier === 'pro') return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_TIER.maxLists - listCount);
}

export function getRemainingSaves(totalSavedCount: number, tier: Tier): number {
  if (tier === 'pro') return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_TIER.maxSaves - totalSavedCount);
}
