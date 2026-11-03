/**
 * Shared shape for stat datasets rendered by `StatsStrip`.
 *
 * Individual datasets live beside their page — see `advertising-stats.ts`.
 * Add new datasets as their own modules rather than growing this file.
 */
export interface StatBlock {
  label: string;
  value: string;
  caption: string;
}
