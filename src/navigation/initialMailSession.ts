import { NOTES } from '../data/notes.ts';
import { addDraft, createDraft } from './draftStore.ts';

// Start in the minimized state: each seeded note is a real draft with its own
// Compose route, so resuming one never creates a duplicate. The stack's top
// route is the last draft, but sheetMotion starts in 'inbox' mode, so the home
// page shows with these sheets collapsed into the dock.
const seeded = [NOTES[0], NOTES[1], NOTES[2]].map((note) => {
  const draft = createDraft({ subject: note.title, body: note.body, sampleNoteId: note.id });
  addDraft(draft);
  return draft;
});

export const initialDraft = seeded[seeded.length - 1];

const routes = [
  { name: 'Inbox' as const },
  ...seeded.map((draft) => ({
    name: 'Compose' as const,
    params: { draftId: draft.id },
  })),
];

export const initialNavigationState = {
  index: routes.length - 1,
  routes,
};
