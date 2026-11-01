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
let drafts: Draft[] = [];
let ids: string[] = [];
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function createDraft(): Draft {
  return {
    id: `draft-${++sequence}-${Date.now().toString(36)}`,
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    extrasOpen: false,
  };
}
export function getDraft(id: string) {
  return drafts.find((draft) => draft.id === id);
}
export function getDraftIds() {
  return ids;
}
export function getDraftCount() {
  return ids.length;
}
export function addDraft(draft: Draft) {
  drafts = [...drafts, draft];
  ids = drafts.map((item) => item.id);
  emit();
}
export function updateDraft(id: string, patch: Partial<Omit<Draft, 'id'>>) {
  drafts = drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft));
  // The ID snapshot and other draft objects keep their identity while typing.
  emit();
}
export function retainDrafts(remaining: readonly string[]) {
  const next = drafts.filter((draft) => remaining.includes(draft.id));
  if (next.length === drafts.length) return;
  drafts = next;
  ids = drafts.map((draft) => draft.id);
  emit();
}
export function useDraftIds() {
  return useSyncExternalStore(subscribe, getDraftIds, getDraftIds);
}
export function useDraft(id: string) {
  return useSyncExternalStore(
    subscribe,
    () => getDraft(id),
    () => getDraft(id),
  );
}
