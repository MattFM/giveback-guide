export interface InlineConfirmOptions {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

const CONFIRM_CONTAINER_ID = "__app_inline_confirm__";

function ensureConfirmContainer(): HTMLElement {
  let container = document.getElementById(CONFIRM_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = CONFIRM_CONTAINER_ID;
    document.body.appendChild(container);
  }
  return container;
}

export function showInlineConfirm(opts: InlineConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const container = ensureConfirmContainer();
    const wrap = document.createElement("div");
    wrap.className = "fixed inset-0 z-50 flex items-center justify-center p-4";

    const overlay = document.createElement("div");
    overlay.className = "absolute inset-0 bg-black/50";

    const card = document.createElement("div");
    card.className =
      "relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg space-y-4";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "inline-confirm-title");

    const isDestructive = opts.variant === "destructive";

    const titleEl = document.createElement("h3");
    titleEl.id = "inline-confirm-title";
    titleEl.className = `text-lg font-semibold leading-none tracking-tight ${isDestructive ? "text-destructive" : ""}`;
    titleEl.textContent = opts.title;

    const bodyEl = document.createElement("p");
    bodyEl.className = "text-sm text-muted-foreground";
    bodyEl.textContent = opts.body;

    const actions = document.createElement("div");
    actions.className = "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className =
      "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
    cancelBtn.textContent = opts.cancelLabel ?? "Cancel";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className =
      isDestructive
        ? "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        : "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
    confirmBtn.textContent = opts.confirmLabel;

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);

    card.appendChild(titleEl);
    card.appendChild(bodyEl);
    card.appendChild(actions);

    wrap.appendChild(overlay);
    wrap.appendChild(card);
    container.appendChild(wrap);

    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => confirmBtn.focus(), 0);

    function close(result: boolean) {
      wrap.remove();
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
      resolve(result);
    }

    confirmBtn.addEventListener("click", () => close(true));
    cancelBtn.addEventListener("click", () => close(false));
    overlay.addEventListener("click", () => close(false));

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
      }
      if (event.key === "Enter" && document.activeElement !== cancelBtn) {
        event.preventDefault();
        close(true);
      }
    }
    document.addEventListener("keydown", onKey);
    const originalOnKey = onKey;
    const observer = new MutationObserver(() => {
      if (!wrap.isConnected) {
        document.removeEventListener("keydown", originalOnKey);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: false });
  });
}

export interface InlineRenameOptions {
  container: HTMLElement;
  initialValue: string;
  maxLength?: number;
  placeholder?: string;
  saveLabel?: string;
  cancelLabel?: string;
}

export function showInlineRename(opts: InlineRenameOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const container = opts.container;
    const originalHtml = container.innerHTML;
    const originalTabIndex = container.getAttribute("tabindex");

    container.innerHTML = `
      <div class="space-y-2">
        <input
          type="text"
          data-rename-input
          value="${(opts.initialValue ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")}"
          maxlength="${opts.maxLength ?? 120}"
          placeholder="${(opts.placeholder ?? "").replace(/"/g, "&quot;")}"
          class="w-full px-2 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div class="flex items-center gap-2">
          <button
            type="button"
            data-rename-save
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >${(opts.saveLabel ?? "Save").replace(/</g, "&lt;")}</button>
          <button
            type="button"
            data-rename-cancel
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >${(opts.cancelLabel ?? "Cancel").replace(/</g, "&lt;")}</button>
        </div>
      </div>
    `;

    const input = container.querySelector<HTMLInputElement>("[data-rename-input]");
    const save = container.querySelector<HTMLButtonElement>("[data-rename-save]");
    const cancel = container.querySelector<HTMLButtonElement>("[data-rename-cancel]");
    if (!input || !save || !cancel) return;

    container.setAttribute("tabindex", "-1");
    input.focus();
    input.select();

    function close(result: string | null) {
      container.innerHTML = originalHtml;
      if (originalTabIndex != null) container.setAttribute("tabindex", originalTabIndex);
      resolve(result);
    }

    function commit() {
      const next = input.value.trim();
      if (next.length === 0) {
        input.focus();
        return;
      }
      close(next);
    }

    save.addEventListener("click", commit);
    cancel.addEventListener("click", () => close(null));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
      }
    });
  });
}
