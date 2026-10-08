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
    confirmBtn.className = isDestructive
      ? "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-destructive/10 text-destructive-foreground hover:bg-destructive/20 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
      : "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer";
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

export interface InlineTextInputOptions {
  title: string;
  body?: string;
  label: string;
  initialValue: string;
  confirmLabel?: string;
  cancelLabel?: string;
  maxLength?: number;
  placeholder?: string;
  validate?: (value: string) => string | null;
}

let textInputIdCounter = 0;

export function showInlineTextInput(
  opts: InlineTextInputOptions,
): Promise<string | null> {
  return new Promise((resolve) => {
    const container = ensureConfirmContainer();
    const wrap = document.createElement("div");
    wrap.className = "fixed inset-0 z-50 flex items-center justify-center p-4";

    const overlay = document.createElement("div");
    overlay.className = "absolute inset-0 bg-black/50";

    const titleId = `inline-input-title-${++textInputIdCounter}`;
    const card = document.createElement("div");
    card.className =
      "relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg space-y-4";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", titleId);

    const titleEl = document.createElement("h3");
    titleEl.id = titleId;
    titleEl.className = "text-lg font-semibold leading-none tracking-tight";
    titleEl.textContent = opts.title;

    const bodyEl = document.createElement("p");
    bodyEl.className = "text-sm text-muted-foreground";
    bodyEl.textContent = opts.body ?? "";

    const labelEl = document.createElement("label");
    labelEl.className =
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
    labelEl.textContent = opts.label;

    const inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.value = opts.initialValue;
    inputEl.maxLength = opts.maxLength ?? 120;
    if (opts.placeholder) inputEl.placeholder = opts.placeholder;
    inputEl.className =
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    const labelRow = document.createElement("div");
    labelRow.appendChild(labelEl);
    const inputRow = document.createElement("div");
    inputRow.appendChild(inputEl);
    const inputWrap = document.createElement("div");
    inputWrap.className = "space-y-2";
    inputWrap.appendChild(labelRow);
    inputWrap.appendChild(inputRow);

    const errorEl = document.createElement("p");
    errorEl.className = "text-xs text-destructive hidden";
    errorEl.setAttribute("role", "alert");

    const actions = document.createElement("div");
    actions.className =
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className =
      "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
    cancelBtn.textContent = opts.cancelLabel ?? "Cancel";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className =
      "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    confirmBtn.textContent = opts.confirmLabel ?? "Save";

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);

    card.appendChild(titleEl);
    if (opts.body) card.appendChild(bodyEl);
    card.appendChild(inputWrap);
    card.appendChild(errorEl);
    card.appendChild(actions);

    wrap.appendChild(overlay);
    wrap.appendChild(card);
    container.appendChild(wrap);

    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      inputEl.focus();
      inputEl.setSelectionRange(0, inputEl.value.length);
    }, 0);

    function clearError(): void {
      errorEl.classList.add("hidden");
      errorEl.textContent = "";
    }

    function commit(): void {
      const trimmed = inputEl.value.trim();
      if (trimmed.length === 0) {
        errorEl.textContent = "Cannot be empty.";
        errorEl.classList.remove("hidden");
        inputEl.focus();
        return;
      }
      if (opts.validate) {
        const message = opts.validate(trimmed);
        if (message) {
          errorEl.textContent = message;
          errorEl.classList.remove("hidden");
          inputEl.focus();
          return;
        }
      }
      close(trimmed);
    }

    function close(result: string | null): void {
      wrap.remove();
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
      resolve(result);
    }

    inputEl.addEventListener("input", clearError);
    inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
      }
    });
    cancelBtn.addEventListener("click", () => close(null));
    confirmBtn.addEventListener("click", commit);
    overlay.addEventListener("click", () => close(null));

    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
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
