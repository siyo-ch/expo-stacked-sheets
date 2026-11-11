export function createInitialNavigationState(ids: readonly string[]) {
  return {
    index: ids.length,
    routes: [
      { name: 'Inbox' },
      ...ids.map((draftId) => ({ name: 'Compose', params: { draftId } })),
    ],
  };
}
