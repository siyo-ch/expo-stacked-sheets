import {
  StackActions,
  createNavigationContainerRef,
  type NavigationState,
} from '@react-navigation/native';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Keyboard, Platform, useWindowDimensions } from 'react-native';
import {
  cancelAnimation,
  ReduceMotion,
  ReducedMotionConfig,
  runOnJS,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addDraft,
  createDraft,
  getDraft,
  getDraftIds,
  retainDrafts,
} from './draftStore';
import {
  CARD_INSET,
  CARD_RADIUS,
  SPRING,
  deckFrame,
  draftDockFrame,
  fullEditorFrame,
  type EditorFrame,
} from './sheetLayout';
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
  frame: SharedValue<EditorFrame>;
  dock: EditorFrame;
  full: EditorFrame;
  height: number;
  width: number;
};
let bridge: Motion | null = null;
let closingId: string | null = null;
const MotionContext = createContext<Motion | null>(null);
export function isEditing(id: string | null) {
  return state.mode === 'compose' && state.activeId === id && !closingId;
}
function show(mode: MailMode, activeId = state.activeId) {
  if (mode !== 'compose') Keyboard.dismiss();
  const wasComposing = state.mode === 'compose';
  setState({ mode, activeId });
  if (bridge) {
    if (mode !== 'overview') cancelAnimation(bridge.scroll);
    bridge.overview.value = withSpring(mode === 'overview' ? 1 : 0, SPRING);
    if (mode !== 'compose' && wasComposing)
      bridge.frame.value = withSpring(bridge.dock, SPRING);
  }
}

export function openCompose() {
  if (!navigationRef.isReady() || closingId || (bridge && bridge.editor.value > 0.01)) return;
  if (bridge) {
    bridge.frame.value = { ...bridge.full, top: bridge.height, progress: 0 };
  }
  const draft = createDraft();
  addDraft(draft);
  navigationRef.dispatch(StackActions.push('Compose', { draftId: draft.id }));
  show('compose', draft.id);
}
export function selectDraft(id: string) {
  if (!navigationRef.isReady() || !getDraft(id) || closingId) return;
  if (isEditing(id)) return;
  if (bridge) {
    const fromDeck = state.mode === 'overview';
    // Reversing a minimize of the same draft keeps the current frame and velocity.
    if (bridge.editor.value > 0.01 && !fromDeck) {
      if (state.activeId !== id) return;
    } else if (fromDeck) {
      const projected = deckFrame(
        getDraftIds().indexOf(id) + 1,
        getDraftIds().length,
        bridge.height,
        bridge.scroll.value,
      );
      bridge.frame.value = {
        ...bridge.full,
        top: projected.top,
        width: bridge.width - CARD_INSET * 2,
        height: bridge.height + 160,
        radius: CARD_RADIUS,
        cosine: projected.cosine,
        taper: projected.taper,
        progress: 0,
      };
    } else bridge.frame.value = bridge.dock;
  }
  navigationRef.navigate('Compose', { draftId: id });
  show('compose', id);
}
export function minimizeCompose() {
  if (state.mode !== 'compose' || closingId) return;
  show('inbox');
}
export function showOverview() {
  if (getDraftIds().length === 0 || closingId || state.mode === 'overview' || (bridge && bridge.editor.value > 0.01)) return;
  if (bridge) bridge.scroll.value = 0;
  show('overview');
}
export function dismissOverview() {
  show('inbox');
}
export function closeDraft(id: string) {
  if (!navigationRef.isReady()) return;
  if (closingId) return;
  if (isEditing(id) && bridge) {
    closingId = id;
    Keyboard.dismiss();
    setState({ mode: 'inbox', activeId: id });
    bridge.frame.value = withSpring(
      { ...bridge.full, top: bridge.height, progress: 0 },
      SPRING,
      (finished) => {
        if (finished) runOnJS(finishClosing)(id);
      },
    );
    return;
  }
  removeDraftRoute(id);
}
function finishClosing(id: string) {
  if (closingId !== id) return;
  closingId = null;
  removeDraftRoute(id);
}
function removeDraftRoute(id: string) {
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
  const initialReduceMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(initialReduceMotion);
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dock = useMemo(() => draftDockFrame(width, height, insets.bottom, Platform.OS === 'ios'), [width, height, insets.bottom]);
  const full = useMemo(() => fullEditorFrame(width, height, insets.top), [width, height, insets.top]);
  const overview = useSharedValue(state.mode === 'overview' ? 1 : 0);
  const frame = useSharedValue(state.mode === 'compose' ? full : dock);
  const editor = useDerivedValue(() => frame.value.progress);
  const scroll = useSharedValue(0);
  const count = useSharedValue(getDraftIds().length);
  const value = useMemo(
    () => ({
      overview,
      editor,
      scroll,
      count,
      frame,
      dock,
      full,
      height,
      width,
    }),
    [
      overview,
      editor,
      scroll,
      count,
      frame,
      dock,
      full,
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
  return (
    <MotionContext.Provider value={value}>
      <ReducedMotionConfig mode={reduceMotion ? ReduceMotion.Always : ReduceMotion.Never} />
      {children}
    </MotionContext.Provider>
  );
}
export function useMotion() {
  const value = useContext(MotionContext);
  if (!value) throw new Error('Missing SheetMotionProvider');
  return value;
}
