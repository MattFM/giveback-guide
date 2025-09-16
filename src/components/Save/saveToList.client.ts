import * as listsAPI from '../../lib/lists';
import * as completed from '../../lib/completed';

async function initSave(root: Element) {
  // prevent duplicate init in HMR
  if ((root as HTMLElement)?.dataset?.saveBound === '1') return;
  (root as HTMLElement).dataset.saveBound = '1';

  const itemIdStr = (root as HTMLElement)?.dataset?.itemId || '';
  const itemTypeStr = (root as HTMLElement)?.dataset?.itemType || 'project';

  const $ = (sel: string) => root.querySelector(sel) as HTMLElement | null;
  const byId = (id: string) => document.getElementById(id) as HTMLElement | null;

  if (!itemIdStr) {
    const btn = $('[id^="save-btn-"]');
    const doneBtn = $('[id^="done-btn-"]');
    const listsArea = $('[id^="lists-area-"]');
    const msgEl = $('[id^="msg-"]');
    const actionsMsg = $('[id^="actions-msg-"]');
    if (btn) {
      btn.setAttribute('disabled', 'true');
      btn.setAttribute('aria-disabled', 'true');
      btn.title = 'Save unavailable (missing item id)';
      btn.style.opacity = '0.6';
      btn.style.pointerEvents = 'none';
    }
    if (doneBtn) {
      doneBtn.setAttribute('disabled', 'true');
      doneBtn.setAttribute('aria-disabled', 'true');
      doneBtn.title = 'Done unavailable (missing item id)';
      doneBtn.style.opacity = '0.6';
      doneBtn.style.pointerEvents = 'none';
    }
    if (listsArea) listsArea.textContent = 'Save unavailable: missing item id.';
    if (msgEl) msgEl.textContent = '';
    if (actionsMsg) actionsMsg.textContent = '';
    return;
  }

  // scoped references
  const btn = $(`#save-btn-${itemIdStr}`);
  const panel = $(`#save-panel-${itemIdStr}`);
  const listsArea = $(`#lists-area-${itemIdStr}`);
  const msgEl = $(`#msg-${itemIdStr}`);
  const doneBtn = $(`#done-btn-${itemIdStr}`);
  const actionsMsg = $(`#actions-msg-${itemIdStr}`);
  const createForm = $(`#create-form-${itemIdStr}`) as HTMLFormElement | null;
  const newTitle = $(`#new-title-${itemIdStr}`) as HTMLInputElement | null;

  try {
    console.debug('SaveToList init', { itemId: itemIdStr, type: itemTypeStr, foundBtn: !!btn, foundPanel: !!panel, root });
  } catch {}

  function updateSaveButtonIcon() {
    try {
      const off = byId('save-ic-off-' + itemIdStr);
      const on = byId('save-ic-on-' + itemIdStr);
      const label = byId('save-label-' + itemIdStr);
      const isSaved = savedSet && savedSet.size > 0;
      if (off && on) {
        if (isSaved) {
          off.classList.add('hidden');
          on.classList.remove('hidden');
          if (btn) btn.title = 'Saved to your lists';
        } else {
          on.classList.add('hidden');
          off.classList.remove('hidden');
          if (btn) btn.title = 'Save to a list';
        }
      }
      if (label) label.textContent = isSaved ? 'Saved' : 'Save';
      if (btn) {
        const inactive = ['bg-white','hover:bg-gray-50','text-gray-700','border-gray-300','focus:ring-blue-500'];
        const active = ['bg-primary-600','hover:bg-primary-700','text-white','border-primary-600','focus:ring-primary-300','shadow'];
        if (isSaved) {
          inactive.forEach(c => btn.classList.remove(c));
          active.forEach(c => btn.classList.add(c));
        } else {
          active.forEach(c => btn.classList.remove(c));
          inactive.forEach(c => btn.classList.add(c));
        }
      }
    } catch {}
  }

  let lists: any[] = [];
  let savedSet = new Set<string>();
  const loadingMap: Record<string, boolean> = {};

  // preload saved + done state
  (async () => {
    try {
      const containing = await listsAPI.getListsContainingItem(itemTypeStr as any, itemIdStr);
      savedSet = new Set((containing || []).map((l: any) => l.id));
      updateSaveButtonIcon();
    } catch {}
    try {
      const status = await completed.getStatus(itemTypeStr as any, itemIdStr);
      setDoneButtonVisual(!!(status && status.is_completed));
    } catch {}
  })();

  function togglePanel(show?: boolean) {
    if (!panel) return;
    const shouldShow = typeof show === 'boolean' ? show : panel.classList.contains('hidden');
    if (shouldShow) {
      panel.classList.remove('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    } else {
      panel.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      showMessage('');
    }
  }

  function setDoneButtonVisual(isDone: boolean) {
    if (!doneBtn) return;
    doneBtn.setAttribute('aria-pressed', String(isDone));
    const off = byId('done-ic-off-' + itemIdStr);
    const on = byId('done-ic-on-' + itemIdStr);
    const label = byId('done-label-' + itemIdStr);
    const inactive = ['bg-white','hover:bg-gray-50','text-gray-700','border-gray-300','focus:ring-blue-500'];
    const active = ['bg-primary-600','hover:bg-primary-700','text-white','border-primary-600','focus:ring-primary-300','shadow'];
    if (isDone) {
      inactive.forEach(c => doneBtn.classList.remove(c));
      active.forEach(c => doneBtn.classList.add(c));
    } else {
      active.forEach(c => doneBtn.classList.remove(c));
      inactive.forEach(c => doneBtn.classList.add(c));
    }
    if (off && on) {
      if (isDone) { off.classList.add('hidden'); on.classList.remove('hidden'); }
      else { on.classList.add('hidden'); off.classList.remove('hidden'); }
    }
    if (label) label.textContent = isDone ? 'Done' : 'Mark as done';
    doneBtn.title = isDone ? 'Marked as done' : 'Mark as done';
  }

  function showMessage(txt: string, isError = false) {
    if (!msgEl) return;
    msgEl.classList.remove('text-red-600');
    if (isError && txt) {
      msgEl.textContent = txt;
      msgEl.classList.add('text-red-600');
    } else {
      msgEl.textContent = '';
    }
  }

  async function refreshLists() {
    if (!listsArea) return;
    listsArea.textContent = 'Loading lists…';
    try {
      lists = await listsAPI.getLists();
      const containing = await listsAPI.getListsContainingItem(itemTypeStr as any, itemIdStr);
      savedSet = new Set((containing || []).map((l: any) => l.id));
      renderListCheckboxes();
      updateSaveButtonIcon();
    } catch (err: any) {
      const errMsg = (err && (err.message || err.error || JSON.stringify(err))) || String(err);
      listsArea.textContent = 'Unable to load lists: ' + errMsg;
      console.error('refreshLists error:', err);
    }
  }

  function renderListCheckboxes() {
    if (!listsArea) return;
    if (!lists || lists.length === 0) {
      listsArea.innerHTML = '<div class="text-gray-500 dark:text-gray-400">You have no lists yet.</div>';
      return;
    }
    listsArea.innerHTML = '';
    const group = document.createElement('div');
    group.className = 'divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden';
    lists.forEach((l: any) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-3 p-3 bg-white dark:bg-gray-800';
      row.dataset.listId = l.id;

      const left = document.createElement('div');
      left.className = 'flex items-center gap-3';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'cb-' + l.id + '-' + itemIdStr;
      cb.checked = savedSet.has(l.id);
      cb.disabled = !!loadingMap[l.id];
      cb.className = 'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500';
      cb.addEventListener('change', () => toggleSave(l.id, cb.checked, cb));

      const label = document.createElement('label');
      label.htmlFor = cb.id;
      label.className = 'text-sm text-gray-900 dark:text-gray-100';
      label.innerHTML = `${l.title}${l.is_default ? ' <span class="ml-2 text-xs text-gray-500">(default)</span>' : ''}`;

      left.appendChild(cb);
      left.appendChild(label);

      const status = document.createElement('span');
      status.className = 'text-xs text-gray-400';
      status.textContent = savedSet.has(l.id) ? 'Saved' : '';

      row.appendChild(left);
      row.appendChild(status);
      group.appendChild(row);
    });
    listsArea.appendChild(group);
  }

  async function toggleSave(listId: string, shouldSave: boolean, cbEl: HTMLInputElement) {
    loadingMap[listId] = true;
    cbEl.disabled = true;
    showMessage('');
    try {
      const row = listsArea?.querySelector(`[data-list-id="${listId}"]`) as HTMLElement | null;
      const status = row?.querySelector('span') as HTMLElement | null;
      if (status) status.textContent = shouldSave ? 'Saving…' : 'Removing…';
    } catch {}
    try {
      if (shouldSave) {
        await listsAPI.saveItemToList(listId, itemTypeStr as any, itemIdStr);
        savedSet.add(listId);
        const row = listsArea?.querySelector(`[data-list-id="${listId}"]`) as HTMLElement | null;
        const status = row?.querySelector('span') as HTMLElement | null;
        if (status) status.textContent = 'Saved';
      } else {
        await listsAPI.removeItemFromList(listId, itemTypeStr as any, itemIdStr);
        savedSet.delete(listId);
        const row = listsArea?.querySelector(`[data-list-id="${listId}"]`) as HTMLElement | null;
        const status = row?.querySelector('span') as HTMLElement | null;
        if (status) status.textContent = '';
      }
    } catch (err: any) {
      cbEl.checked = !shouldSave;
      showMessage(err && err.message ? err.message : String(err), true);
      console.error(err);
    } finally {
      loadingMap[listId] = false;
      cbEl.disabled = false;
      updateSaveButtonIcon();
    }
  }

  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = (newTitle?.value || '').trim();
      if (!title) return showMessage('Enter a list title', true);
      try {
        const created = await listsAPI.createList(title, null, false);
        lists.push(created);
        await listsAPI.saveItemToList(created.id, itemTypeStr as any, itemIdStr);
        savedSet.add(created.id);
        if (newTitle) newTitle.value = '';
        renderListCheckboxes();
        updateSaveButtonIcon();
      } catch (err: any) {
        showMessage(err && err.message ? err.message : String(err), true);
        console.error(err);
      }
    });
  }

  if (btn) {
    btn.addEventListener('click', async (e) => {
      try { console.debug('SaveToList click', { itemId: itemIdStr }); } catch {}
      e.preventDefault();
      e.stopPropagation();
      if (!panel) return;
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        togglePanel(true);
        await refreshLists();
        if (newTitle) newTitle.focus();
      } else {
        togglePanel(false);
      }
    });
  }

  if (btn) {
    btn.addEventListener('keydown', async (e) => {
      if ((e as KeyboardEvent).key !== 'Enter' && (e as KeyboardEvent).key !== ' ') return;
      e.preventDefault();
      if (!panel) return;
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        togglePanel(true);
        await refreshLists();
        if (newTitle) newTitle.focus();
      } else {
        togglePanel(false);
      }
    });
  }

  if (doneBtn) {
    doneBtn.addEventListener('click', async () => {
      if (actionsMsg) actionsMsg.textContent = '';
      const pressed = (doneBtn.getAttribute('aria-pressed') === 'true');
      const next = !pressed;
      setDoneButtonVisual(next);
      try {
        const res = await completed.setCompleted(itemTypeStr as any, itemIdStr, next);
        if (!res) {
          setDoneButtonVisual(pressed);
          if (actionsMsg) actionsMsg.textContent = 'Please log in to mark as done.';
          return;
        }
        const status = await completed.getStatus(itemTypeStr as any, itemIdStr);
        setDoneButtonVisual(!!(status && status.is_completed));
      } catch {
        setDoneButtonVisual(pressed);
        if (actionsMsg) actionsMsg.textContent = 'Unable to update status.';
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape' && panel && !panel.classList.contains('hidden')) {
      togglePanel(false);
    }
  });
}

function initAll() {
  const roots = document.querySelectorAll('[id^="save-root-"][data-item-id]');
  if (roots && roots.length) roots.forEach((r) => initSave(r));
  else {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[id^="save-root-"][data-item-id]').forEach((r) => initSave(r));
    });
  }
}

initAll();
