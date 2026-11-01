import assert from 'node:assert/strict';
import {
  createDraft,
  addDraft,
  getDraft,
  getDraftIds,
  retainDrafts,
  updateDraft,
} from './draftStore.ts';
const a = createDraft(),
  b = createDraft(),
  c = createDraft();
addDraft(a);
addDraft(b);
addDraft(c);
const ids = getDraftIds();
const unchanged = getDraft(b.id);
updateDraft(a.id, { subject: 'Preserved after minimize', body: 'draft body' });
assert.equal(
  getDraftIds(),
  ids,
  'typing must not rerender subscribers to the draft ID list',
);
assert.equal(
  getDraft(b.id),
  unchanged,
  'typing must not rerender other draft previews',
);
assert.equal(getDraft(a.id)?.subject, 'Preserved after minimize');
retainDrafts([a.id, c.id]);
assert.deepEqual(
  getDraftIds(),
  [a.id, c.id],
  'an arbitrary middle card can be removed',
);
assert.equal(
  getDraft(a.id)?.body,
  'draft body',
  'closing another draft preserves contents',
);
retainDrafts([a.id]);
assert.deepEqual(getDraftIds(), [a.id], 'back removes only the last draft route');
assert.equal(getDraft(a.id)?.subject, 'Preserved after minimize');
retainDrafts([]);
assert.deepEqual(getDraftIds(), []);
console.log('draftStore tests passed');
