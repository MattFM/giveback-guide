export type ToastKind = "success" | "error";

const TOAST_DURATION_MS = 6000;
const CONTAINER_ID = "__app_toast_container__";

function ensureContainer(): HTMLElement {
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.className =
      "fixed top-20 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none";
    document.body.appendChild(container);
  }
  return container;
}

function iconFor(kind: ToastKind): string {
  if (kind === "success") {
    return '<svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
  }
  return '<svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.366-.446.957-.71 1.553-.713h.38c.596.003 1.187.267 1.553.713l5.078 6.183c.344.418.45.994.286 1.505a2 2 0 01-1.9 1.322H4.74a2 2 0 01-1.9-1.322 1.75 1.75 0 01.286-1.505l5.078-6.183zM11 9a1 1 0 10-2 0v3a1 1 0 002 0V9zM9 14a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"></path></svg>';
}

function accentFor(kind: ToastKind): string {
  if (kind === "success") {
    return "bg-success/10 text-success ring-success/30";
  }
  return "bg-destructive/10 text-destructive ring-destructive/30";
}

export function showToast(kind: ToastKind, message: string): void {
  const container = ensureContainer();
  const toast = document.createElement("div");
  toast.className =
    "pointer-events-auto flex items-start gap-3 p-4 max-w-sm rounded-lg shadow-md ring-1 bg-card text-card-foreground";
  toast.setAttribute("role", kind === "error" ? "alert" : "status");
  toast.setAttribute("aria-live", kind === "error" ? "assertive" : "polite");
  toast.innerHTML = `
    <div class="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 mt-0.5 rounded-full ring-1 ${accentFor(kind)}">
      ${iconFor(kind)}
    </div>
    <div class="text-sm font-medium leading-snug">${message}</div>
    <button
      type="button"
      class="shrink-0 -mx-1.5 -my-1.5 rounded-md p-1 hover:bg-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Dismiss notification"
    >
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        ></path>
      </svg>
    </button>
  `;
  const close = toast.querySelector("button");
  close?.addEventListener("click", () => toast.remove());
  container.appendChild(toast);
  window.setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}
