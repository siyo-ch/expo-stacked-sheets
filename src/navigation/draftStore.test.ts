import assert from 'node:assert/strict';
import { createDraftStore } from '../../packages/stacked-sheets/src/draftStore.ts';

const {
  createDraft,
  addDraft,
  getDraft,
  getDraftIds,
  retainDrafts,
  updateDraft,
} = createDraftStore();
const a = createDraft(),
  b = createDraft(),
  c = createDraft();
addDraft(a);
addDraft(b);
addDraft(c);
const ids = getDraftIds();
const unchanged = getDraft(b.id);
updateDraft(a.id, { title: 'Preserved after minimize', body: 'draft body' });
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
assert.equal(getDraft(a.id)?.title, 'Preserved after minimize');
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
assert.equal(getDraft(a.id)?.title, 'Preserved after minimize');
retainDrafts([]);
assert.deepEqual(getDraftIds(), []);

const other = createDraftStore([{ title: 'Independent stack' }]);
assert.equal(other.getDraft(other.getDraftIds()[0])?.title, 'Independent stack');
assert.deepEqual(getDraftIds(), [], 'another stack cannot add drafts to this stack');
const seeded = createDraftStore([{ id: 'sheet-1', title: 'Seed' }, {}, { id: 'sheet-1' }]);
assert.deepEqual(seeded.getDraftIds(), ['sheet-1', 'sheet-2', 'sheet-3']);
assert.equal(seeded.createDraft().id, 'sheet-4', 'new drafts cannot reuse a seed ID');
console.log('draftStore tests passed');
