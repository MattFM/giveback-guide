/**
 * Stub for Bearnie's Tabs runtime initialiser.
 *
 * `ui-boot` imports this symbol but the file was not materialised when
 * Bearnie was installed and the Tabs* components themselves are not used
 * on `/home-new/`. Expose a no-op so `bootUiRuntime()` can run end-to-end.
 * Replace this file's content if/when Tabs actually needs its own logic.
 */
export function initTabs(): void {
  // No-op: Tabs runtime not in active use on this page yet.
}
