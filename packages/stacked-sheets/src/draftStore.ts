import type { InitialSheet, Sheet, SheetContent } from './types';

export function createDraftStore(initialSheets: readonly InitialSheet[] = []) {
  let sequence = 0;
  const reservedIds = new Set(initialSheets.map((sheet) => sheet.id));
  const assignedIds = new Set<string>();
  let drafts = initialSheets.map(({ id, ...content }) => {
    if (!id || assignedIds.has(id)) return createDraft(content);
    assignedIds.add(id);
    return buildDraft(content, id);
  });
  let ids = drafts.map((sheet) => sheet.id);
  const listeners = new Set<() => void>();

  function createDraft(content: SheetContent = {}): Sheet {
    let id = `sheet-${++sequence}`;
    while (reservedIds.has(id)) id = `sheet-${++sequence}`;
    return buildDraft(content, id);
  }

  function buildDraft(content: SheetContent, id: string): Sheet {
    return {
      id,
      title: content.title ?? '',
      body: content.body ?? '',
      image: content.image,
    };
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function replaceDrafts(next: Sheet[]) {
    drafts = next;
    ids = drafts.map((draft) => draft.id);
    emit();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getDraft(id: string) {
    return drafts.find((draft) => draft.id === id);
  }

  function getDraftIds() {
    return ids;
  }

  function addDraft(draft: Sheet) {
    replaceDrafts([...drafts, draft]);
  }

  function updateDraft(id: string, changes: Partial<SheetContent>) {
    const current = getDraft(id);
    if (!current) return;
    const updated = {
      ...current,
      ...changes,
      title: changes.title ?? current.title,
      body: changes.body ?? current.body,
    };
    // Preserve the ID snapshot and other sheets' identities while editing.
    drafts = drafts.map((draft) => (draft.id === id ? updated : draft));
    emit();
  }

  function retainDrafts(remaining: readonly string[]) {
    const next = drafts.filter((draft) => remaining.includes(draft.id));
    if (next.length !== drafts.length) replaceDrafts(next);
  }

  return { addDraft, createDraft, getDraft, getDraftIds, retainDrafts, subscribe, updateDraft };
}
