import { addDraft, createDraft } from './draftStore.ts';

// Start this prototype in the reference's minimized-draft state. The draft is
// real session data with its own route, so resuming it never creates a duplicate.
export const initialDraft = createDraft();
addDraft(initialDraft);

export const initialNavigationState = {
  index: 1,
  routes: [
    { name: 'Inbox' },
    { name: 'Compose', params: { draftId: initialDraft.id } },
  ],
};
