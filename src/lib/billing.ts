import { pb } from './pocketbase';
import type { Tier } from './tier-limits';

export type TierSource = 'migration' | 'signup' | 'self-upgrade' | 'admin';

export const TIER_SOURCES: TierSource[] = ['migration', 'signup', 'self-upgrade', 'admin'];

export interface BillingStatus {
  tier: Tier;
  setAt: number | null;
  source: TierSource | null;
}

function normalizeTier(value: unknown): Tier {
  return value === 'pro' ? 'pro' : 'free';
}

function readPrefs(): Record<string, unknown> {
  const client = pb();
  const record = client.authStore.record;
  if (!record) return {};
  const prefs = record.prefs;
  if (prefs && typeof prefs === 'object' && !Array.isArray(prefs)) {
    return prefs as Record<string, unknown>;
  }
  return {};
}

export async function getAccountTier(): Promise<Tier> {
  const client = pb();
  if (!client.authStore.record) return 'free';
  return normalizeTier(readPrefs().tier);
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const client = pb();
  if (!client.authStore.record) {
    return { tier: 'free', setAt: null, source: null };
  }
  const prefs = readPrefs();
  const rawSetAt = prefs.tier_set_at;
  const rawSource = prefs.tier_source;
  return {
    tier: normalizeTier(prefs.tier),
    setAt: typeof rawSetAt === 'number' ? rawSetAt : null,
    source: typeof rawSource === 'string' && TIER_SOURCES.includes(rawSource as TierSource)
      ? (rawSource as TierSource)
      : null,
  };
}

export async function setAccountTier(tier: Tier, source: TierSource): Promise<void> {
  if (!TIER_SOURCES.includes(source)) {
    throw new Error(`Invalid tier source: ${source}`);
  }
  const client = pb();
  const record = client.authStore.record;
  if (!record || !record.id) throw new Error('Not authenticated');
  const existingPrefs = readPrefs();
  const newPrefs = {
    ...existingPrefs,
    tier,
    tier_set_at: Math.floor(Date.now() / 1000),
    tier_source: source,
  };
  const userId = record.id as string;
  await client.collection('users').update(userId, { prefs: newPrefs });
}

export async function startUpgradeCheckout(): Promise<never> {
  throw new Error('Payment provider not yet configured');
}
