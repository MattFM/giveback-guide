/**
 * Bearnie Tabs runtime initialiser.
 *
 * Wires click and arrow-key handlers on each `[data-tabs]` root, and
 * activates the default tab on mount. Idempotent — re-runs after every
 * Astro view-transition navigation (`astro:page-load`).
 */
export function initTabs(): void {
  document.querySelectorAll<HTMLElement>("[data-tabs]").forEach((root) => {
    if (root.hasAttribute("data-tabs-initialized")) return;
    root.setAttribute("data-tabs-initialized", "true");

    const triggers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-tabs-trigger]"),
    );
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>("[data-tabs-content]"),
    );
    if (triggers.length === 0 || panels.length === 0) return;

    const defaultValue = root.getAttribute("data-default-value");

    function activate(value: string | null): void {
      if (!value) return;
      triggers.forEach((trigger) => {
        const isActive = trigger.getAttribute("data-value") === value;
        trigger.setAttribute("data-state", isActive ? "active" : "inactive");
        trigger.setAttribute("aria-selected", isActive ? "true" : "false");
        trigger.setAttribute("tabindex", isActive ? "0" : "-1");
      });
      panels.forEach((panel) => {
        const isActive = panel.getAttribute("data-value") === value;
        panel.setAttribute("data-state", isActive ? "active" : "inactive");
        if (isActive) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "");
        }
      });
    }

    activate(defaultValue);

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        activate(trigger.getAttribute("data-value"));
      });
      trigger.addEventListener("keydown", (event) => {
        const index = triggers.indexOf(trigger);
        if (index < 0) return;
        let targetIndex: number | null = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          targetIndex = (index + 1) % triggers.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          targetIndex = (index - 1 + triggers.length) % triggers.length;
        } else if (event.key === "Home") {
          targetIndex = 0;
        } else if (event.key === "End") {
          targetIndex = triggers.length - 1;
        }
        if (targetIndex === null) return;
        event.preventDefault();
        const next = triggers[targetIndex];
        activate(next.getAttribute("data-value"));
        next.focus();
      });
    });
  });
}
