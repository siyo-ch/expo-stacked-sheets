import { useSyncExternalStore } from 'react';

export type Draft = {
  id: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  extrasOpen: boolean;
};

let sequence = 0;

const store = {
  drafts: [] as Draft[],
  listeners: new Set<() => void>(),
};

function emit() {
  store.listeners.forEach((listener) => listener());
}

export function createDraft(): Draft {
  sequence += 1;
  return {
    id: `draft-${sequence}-${Date.now().toString(36)}`,
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    extrasOpen: false,
  };
}

export function getDraftCount() {
  return store.drafts.length;
}

export function addDraft(draft: Draft) {
  store.drafts = [...store.drafts, draft];
  emit();
}

export function updateDraft(id: string, patch: Partial<Omit<Draft, 'id'>>) {
  store.drafts = store.drafts.map((draft) =>
    draft.id === id ? { ...draft, ...patch } : draft,
  );
  emit();
}

export function trimDrafts(count: number) {
  if (store.drafts.length <= count) return;
  store.drafts = store.drafts.slice(0, Math.max(0, count));
  emit();
}

function subscribe(listener: () => void) {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

function getSnapshot() {
  return store.drafts;
}

export function useDrafts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
