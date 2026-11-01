import assert from 'node:assert/strict';
import { StackRouter, StackActions, CommonActions } from '@react-navigation/routers';
import { getDraftIds, retainDrafts, updateDraft, getDraft } from './draftStore.ts';
import { initialDraft, initialNavigationState } from './initialMailSession.ts';

const router = StackRouter({ initialRouteName: 'Inbox' });
const options = {
  routeNames: ['Inbox', 'Compose'],
  routeParamList: { Inbox: undefined, Compose: undefined },
  routeGetIdList: {
    Compose: ({ params }: { params?: object }) =>
      (params as { draftId?: string })?.draftId,
  },
};
let state = router.getRehydratedState(initialNavigationState, options);
function dispatch(action: Parameters<typeof router.getStateForAction>[1]) {
  const next = router.getStateForAction(state, action, options);
  assert.ok(next);
  state = next;
}
assert.equal(state.routes.length, 2, 'startup includes a real minimized draft route');
assert.deepEqual(getDraftIds(), [initialDraft.id]);
updateDraft(initialDraft.id, { subject: 'Resume startup draft' });
const startupKey = state.routes[1].key;
dispatch(CommonActions.navigate('Compose', { draftId: initialDraft.id }));
assert.equal(state.routes.length, 2, 'resuming the startup draft must not duplicate it');
assert.equal(state.routes[1].key, startupKey);
assert.equal(getDraft(initialDraft.id)?.subject, 'Resume startup draft');
dispatch(CommonActions.goBack());
retainDrafts([]);
assert.equal(state.routes.length, 1, 'closing the startup draft returns to Inbox');
assert.deepEqual(getDraftIds(), [], 'the startup draft must not be recreated on close');

for (const draftId of ['a', 'b', 'c'])
  dispatch(StackActions.push('Compose', { draftId }));
assert.equal(state.routes.length, 4, 'each draft has its own native-stack route');
const originalKeys = state.routes.map((route) => route.key);
dispatch(CommonActions.navigate('Compose', { draftId: 'a' }));
assert.equal(
  state.routes.length,
  4,
  'selecting an earlier draft must not pop other drafts',
);
assert.deepEqual(
  state.routes.map((route) => route.key).sort(),
  [...originalKeys].sort(),
);
assert.equal((state.routes.at(-1)?.params as { draftId: string }).draftId, 'a');
dispatch(CommonActions.goBack());
assert.equal(state.routes.length, 3, 'Android back pops exactly one selected draft');
assert.deepEqual(
  state.routes.slice(1).map((route) => (route.params as { draftId: string }).draftId),
  ['b', 'c'],
);
console.log('draftHistory tests passed');
