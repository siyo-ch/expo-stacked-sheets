import {
  StackActions,
  type NavigationContainerRef,
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
import { createDraftStore } from './draftStore';
import { createInitialNavigationState } from './navigationState';
import {
  CARD_INSET,
  CARD_RADIUS,
  SPRING,
  deckFrame,
  draftDockFrame,
  fullEditorFrame,
  type EditorFrame,
} from './sheetLayout';
import type { SheetContent, SheetMode, SheetOrigin, SheetStackParamList } from './types';

type ViewState = { mode: SheetMode; activeId: string | null };

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

export function createSheetController(initialSheets?: readonly SheetContent[]) {
  const store = createDraftStore(initialSheets);
  let navigation: NavigationContainerRef<SheetStackParamList> | null = null;
  const initialIds = store.getDraftIds();
  const initialNavigationState = createInitialNavigationState(initialIds);
  let state: ViewState = { mode: 'inbox', activeId: initialIds.at(-1) ?? null };
  let bridge: Motion | null = null;
  let closingId: string | null = null;
  const listeners = new Set<() => void>();

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function snapshot() {
    return state;
  }

  function setState(next: ViewState) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function setMotion(value: Motion | null) {
    bridge = value;
  }

  function attachNavigator(navigator: NavigationContainerRef<SheetStackParamList> | null) {
    navigation = navigator;
  }

  function isEditing(id: string | null) {
    return state.mode === 'compose' && state.activeId === id && !closingId;
  }
  function show(mode: SheetMode, activeId = state.activeId) {
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

  function openSheet(content: SheetContent = {}, origin?: SheetOrigin) {
    if (!navigation?.isReady() || closingId || (bridge && bridge.editor.value > 0.01)) return;
    if (bridge) {
      // The editor frame is always horizontally centered; a tapped row is full
      // width, so the sheet grows straight out of it.
      bridge.frame.value = origin
        ? {
            ...bridge.full,
            top: origin.y,
            width: origin.width,
            height: origin.height,
            radius: origin.width * 0.12,
            progress: 0,
          }
        : { ...bridge.full, top: bridge.height, progress: 0 };
    }
    const draft = store.createDraft(content);
    store.addDraft(draft);
    navigation.dispatch(StackActions.push('Compose', { draftId: draft.id }));
    show('compose', draft.id);
  }
  function selectDraft(id: string) {
    if (!navigation?.isReady() || !store.getDraft(id) || closingId) return;
    if (isEditing(id)) return;
    if (bridge) {
      const fromDeck = state.mode === 'overview';
      // Reversing a minimize of the same draft keeps the current frame and velocity.
      if (bridge.editor.value > 0.01 && !fromDeck) {
        if (state.activeId !== id) return;
      } else if (fromDeck) {
        const projected = deckFrame(
          store.getDraftIds().indexOf(id) + 1,
          store.getDraftIds().length,
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
    navigation.navigate('Compose', { draftId: id });
    show('compose', id);
  }
  function minimizeCompose() {
    if (state.mode !== 'compose' || closingId) return;
    show('inbox');
  }
  function showOverview() {
    if (store.getDraftIds().length === 0 || closingId || state.mode === 'overview' || (bridge && bridge.editor.value > 0.01)) return;
    if (bridge) bridge.scroll.value = 0;
    show('overview');
  }
  function dismissOverview() {
    show('inbox');
  }
  function closeDraft(id: string) {
    if (!navigation?.isReady()) return;
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
    if (!navigation?.isReady()) return;
    const root = navigation.getRootState();
    if (!root) return;
    const routes = root.routes.filter(
      (route) =>
        route.name !== 'Compose' ||
        (route.params as { draftId?: string } | undefined)?.draftId !== id,
    );
    navigation.resetRoot({ ...root, routes, index: routes.length - 1 });
  }
  function requestCloseTop() {
    if (state.activeId) closeDraft(state.activeId);
  }
  function onNavigationStateChange(root: NavigationState | undefined) {
    if (!root) return;
    const remaining = root.routes
      .filter((route) => route.name === 'Compose')
      .map((route) => (route.params as { draftId: string }).draftId);
    const removed = store.getDraftIds().filter((id) => !remaining.includes(id));
    store.retainDrafts(remaining);
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

  return {
    store,
    attachNavigator,
    initialNavigationState,
    snapshot,
    subscribe,
    setMotion,
    isEditing,
    openSheet,
    selectDraft,
    minimizeCompose,
    showOverview,
    dismissOverview,
    closeDraft,
    requestCloseTop,
    onNavigationStateChange,
  };
}

type Controller = ReturnType<typeof createSheetController>;
const ControllerContext = createContext<Controller | null>(null);
const MotionContext = createContext<Motion | null>(null);

export function useSheetController() {
  const controller = useContext(ControllerContext);
  if (!controller) throw new Error('Missing StackedSheets');
  return controller;
}

export function useMailView() {
  const { subscribe, snapshot } = useSheetController();
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useDraftIds() {
  const { subscribe, getDraftIds } = useSheetController().store;
  return useSyncExternalStore(subscribe, getDraftIds, getDraftIds);
}

export function useDraft(id: string) {
  const { subscribe, getDraft } = useSheetController().store;
  return useSyncExternalStore(subscribe, () => getDraft(id), () => getDraft(id));
}

export function SheetMotionProvider({ controller, children }: { controller: Controller; children: ReactNode }) {
  const state = controller.snapshot();
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
  const count = useSharedValue(controller.store.getDraftIds().length);
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
    controller.setMotion(value);
    return () => controller.setMotion(null);
  }, [controller, value]);
  return (
    <ControllerContext.Provider value={controller}>
      <MotionContext.Provider value={value}>
        <ReducedMotionConfig mode={reduceMotion ? ReduceMotion.Always : ReduceMotion.Never} />
        {children}
      </MotionContext.Provider>
    </ControllerContext.Provider>
  );
}
export function useMotion() {
  const value = useContext(MotionContext);
  if (!value) throw new Error('Missing SheetMotionProvider');
  return value;
}
