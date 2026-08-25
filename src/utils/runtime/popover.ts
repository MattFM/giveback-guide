import { generateId } from "@/utils/focus-trap";

export function initPopovers() {
  document.querySelectorAll("[data-popover]").forEach((popover) => {
    if (popover.hasAttribute("data-initialized")) return;
    popover.setAttribute("data-initialized", "true");

    const trigger = popover.querySelector("[data-popover-trigger]") as
      | HTMLElement
      | null;
    const content = popover.querySelector("[data-popover-content]") as
      | HTMLElement
      | null;

    if (!trigger || !content) return;

    if (!content.id) {
      content.id = generateId("popover");
    }

    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", content.id);
    trigger.setAttribute("aria-expanded", "false");

    const openPopover = () => {
      content.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      const firstFocusable = content.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null;
      firstFocusable?.focus();
    };

    const closePopover = () => {
      content.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    };

    const togglePopover = () => {
      if (content.hidden) {
        openPopover();
      } else {
        closePopover();
      }
    };

    trigger.addEventListener("click", togglePopover);

    document.addEventListener("click", (e) => {
      if (!popover.contains(e.target as Node) && !content.hidden) {
        closePopover();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !content.hidden) {
        closePopover();
      }
    });
  });
}
