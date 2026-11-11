import type { Sheet, SheetContent } from './types';

export function createDraftStore(initialSheets: readonly SheetContent[] = []) {
  let sequence = 0;
  let drafts = initialSheets.map(createDraft);
  let ids = drafts.map((sheet) => sheet.id);
  const listeners = new Set<() => void>();

  function createDraft(content: SheetContent = {}): Sheet {
    return {
      id: `sheet-${++sequence}`,
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
