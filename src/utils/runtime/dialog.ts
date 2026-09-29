/**
 * Stub for Bearnie's Dialog runtime initialiser.
 *
 * `ui-boot` imports this symbol but neither the file nor the Dialog*
 * components were materialised when Bearnie was installed in this project.
 * Expose a no-op so `bootUiRuntime()` can run end-to-end. Delete this file
 * if/when the Dialog* components land upstream.
 */
export function initDialogs(): void {
  // No-op until Dialog components are installed.
}
