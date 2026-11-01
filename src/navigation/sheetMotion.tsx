import {
  StackActions,
  createNavigationContainerRef,
  type NavigationState,
} from '@react-navigation/native';
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Keyboard, useWindowDimensions } from 'react-native';
import { useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import {
  addDraft,
  createDraft,
  getDraft,
  getDraftIds,
  retainDrafts,
} from './draftStore';
import { SPRING, deckFrame } from './sheetLayout';
import { initialDraft } from './initialMailSession';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
export type MailMode = 'inbox' | 'compose' | 'overview';
type ViewState = { mode: MailMode; activeId: string | null };
let state: ViewState = { mode: 'inbox', activeId: initialDraft.id };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => state;
function setState(next: ViewState) {
  state = next;
  listeners.forEach((listener) => listener());
}
export function useMailView() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

type Motion = {
  overview: SharedValue<number>;
  editor: SharedValue<number>;
  scroll: SharedValue<number>;
  count: SharedValue<number>;
  originY: SharedValue<number>;
  originX: SharedValue<number>;
  originScaleX: SharedValue<number>;
  originScaleY: SharedValue<number>;
  height: number;
  width: number;
};
let bridge: Motion | null = null;
const MotionContext = createContext<Motion | null>(null);
function show(mode: MailMode, activeId = state.activeId) {
  if (mode !== 'compose') Keyboard.dismiss();
  if (bridge && mode === 'compose' && state.mode !== 'compose') bridge.editor.value = 0;
  setState({ mode, activeId });
  if (bridge) {
    bridge.overview.value = withSpring(mode === 'overview' ? 1 : 0, SPRING);
    // The editor starts its opening spring after its native view commits.
    if (mode !== 'compose') bridge.editor.value = withSpring(0, SPRING);
  }
}

export function openCompose() {
  if (!navigationRef.isReady()) return;
  if (bridge) {
    bridge.originY.value = bridge.height * 0.84;
    bridge.originX.value = bridge.width * 0.36;
    bridge.originScaleX.value = 0.18;
    bridge.originScaleY.value = 0.18;
  }
  const draft = createDraft();
  addDraft(draft);
  navigationRef.dispatch(StackActions.push('Compose', { draftId: draft.id }));
  show('compose', draft.id);
}
export function selectDraft(id: string) {
  if (!navigationRef.isReady() || !getDraft(id)) return;
  if (bridge) {
    const fromDeck = state.mode === 'overview';
    bridge.originY.value = fromDeck
      ? deckFrame(
          getDraftIds().indexOf(id) + 1,
          getDraftIds().length,
          bridge.height,
          bridge.scroll.value,
        ).top
      : bridge.height * 0.92;
    bridge.originX.value = 0;
    bridge.originScaleX.value = 0.94;
    bridge.originScaleY.value = fromDeck ? 0.7 : 0.07;
  }
  navigationRef.navigate('Compose', { draftId: id });
  show('compose', id);
}
export function minimizeCompose() {
  if (bridge) {
    bridge.originY.value = bridge.height * 0.92;
    bridge.originX.value = 0;
    bridge.originScaleX.value = 0.94;
    bridge.originScaleY.value = 0.07;
  }
  show('inbox');
}
export function showOverview() {
  if (getDraftIds().length === 0) return;
  if (bridge) bridge.scroll.value = 0;
  show('overview');
}
export function dismissOverview() {
  show('inbox');
}
export function closeDraft(id: string) {
  if (!navigationRef.isReady()) return;
  const root = navigationRef.getRootState();
  if (!root) return;
  const routes = root.routes.filter(
    (route) =>
      route.name !== 'Compose' ||
      (route.params as { draftId?: string } | undefined)?.draftId !== id,
  );
  navigationRef.resetRoot({ ...root, routes, index: routes.length - 1 });
}
export function requestCloseTop() {
  if (state.activeId) closeDraft(state.activeId);
}
export function onNavigationStateChange(root: NavigationState | undefined) {
  if (!root) return;
  const remaining = root.routes
    .filter((route) => route.name === 'Compose')
    .map((route) => (route.params as { draftId: string }).draftId);
  const removed = getDraftIds().filter((id) => !remaining.includes(id));
  retainDrafts(remaining);
  if (removed.includes(state.activeId ?? '')) {
    const active = root.routes[root.index];
    const id =
      active.name === 'Compose' ? (active.params as { draftId: string }).draftId : null;
    show(
      state.mode === 'compose' && id
        ? 'compose'
        : remaining.length && state.mode === 'overview'
          ? 'overview'
          : 'inbox',
      id,
    );
  } else if (remaining.length === 0 && state.mode !== 'inbox') {
    show('inbox', null);
  }
}
export function SheetMotionProvider({ children }: { children: ReactNode }) {
  const overview = useSharedValue(state.mode === 'overview' ? 1 : 0);
  const editor = useSharedValue(state.mode === 'compose' ? 1 : 0);
  const scroll = useSharedValue(0);
  const count = useSharedValue(getDraftIds().length);
  const originY = useSharedValue(0),
    originX = useSharedValue(0);
  const originScaleX = useSharedValue(0.94),
    originScaleY = useSharedValue(0.1);
  const { height, width } = useWindowDimensions();
  const value = useMemo(
    () => ({
      overview,
      editor,
      scroll,
      count,
      originY,
      originX,
      originScaleX,
      originScaleY,
      height,
      width,
    }),
    [
      overview,
      editor,
      scroll,
      count,
      originY,
      originX,
      originScaleX,
      originScaleY,
      height,
      width,
    ],
  );
  useLayoutEffect(() => {
    bridge = value;
    return () => {
      bridge = null;
    };
  }, [value]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
export function useMotion() {
  const value = useContext(MotionContext);
  if (!value) throw new Error('Missing SheetMotionProvider');
  return value;
}
