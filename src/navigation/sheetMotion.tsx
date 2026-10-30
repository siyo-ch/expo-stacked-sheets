import {
  StackActions,
  createNavigationContainerRef,
  type NavigationState,
} from '@react-navigation/native';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  Easing,
  runOnJS,
  type SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  addDraft,
  createDraft,
  getDraftCount,
  trimDrafts,
} from './draftStore';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const TIMING = {
  duration: 440,
  easing: Easing.out(Easing.cubic),
};

type MotionBridge = {
  presented: SharedValue<number> | null;
  drag: SharedValue<number> | null;
  locked: SharedValue<boolean> | null;
};

const bridge: MotionBridge = {
  presented: null,
  drag: null,
  locked: null,
};

let closing = false;
let closeTarget = -1;
let pending: (() => void) | null = null;
let generation = 0;

function finishAnimation(token: number) {
  if (token !== generation) return;
  const callback = pending;
  pending = null;
  callback?.();
}

function animateTo(count: number, after?: () => void) {
  const presented = bridge.presented;
  const drag = bridge.drag;
  if (!presented || !drag) return;
  const token = ++generation;
  pending = after ?? null;
  drag.value = withTiming(0, TIMING);
  presented.value = withTiming(count, TIMING, (finished) => {
    'worklet';
    if (finished) {
      runOnJS(finishAnimation)(token);
    }
  });
}

function beginClose(routes: number) {
  if (closing && closeTarget === routes) return;
  closing = true;
  closeTarget = routes;
  if (bridge.locked) bridge.locked.value = true;
  animateTo(routes, () => {
    trimDrafts(closeTarget);
    if (getDraftCount() <= closeTarget) {
      closing = false;
      if (bridge.locked) bridge.locked.value = false;
    }
  });
}

export function openCompose() {
  if (closing || bridge.locked?.value) return;
  if (!navigationRef.isReady()) return;
  const draft = createDraft();
  addDraft(draft);
  animateTo(getDraftCount());
  navigationRef.dispatch(StackActions.push('Compose', { draftId: draft.id }));
}

export function requestCloseTop() {
  if (closing) return;
  if (!navigationRef.isReady() || !navigationRef.canGoBack()) {
    if (bridge.drag) bridge.drag.value = withTiming(0, { duration: 240 });
    return;
  }
  closing = true;
  if (bridge.locked) bridge.locked.value = true;
  navigationRef.goBack();
}

export function onNavigationStateChange(state: NavigationState | undefined) {
  const routes = state
    ? state.routes.filter((route) => route.name === 'Compose').length
    : 0;
  const drafts = getDraftCount();
  if (routes < drafts) {
    beginClose(routes);
    return;
  }
  if (routes > drafts) {
    const missing = routes - drafts;
    for (let index = 0; index < missing; index += 1) {
      addDraft(createDraft());
    }
    animateTo(getDraftCount());
  }
}

type Motion = {
  presented: SharedValue<number>;
  drag: SharedValue<number>;
  locked: SharedValue<boolean>;
  openCompose: () => void;
  requestCloseTop: () => void;
};

const MotionContext = createContext<Motion | null>(null);

export function SheetMotionProvider({ children }: { children: ReactNode }) {
  const presented = useSharedValue(0);
  const drag = useSharedValue(0);
  const locked = useSharedValue(false);
  bridge.presented = presented;
  bridge.drag = drag;
  bridge.locked = locked;

  const value = useMemo<Motion>(
    () => ({
      presented,
      drag,
      locked,
      openCompose,
      requestCloseTop,
    }),
    [presented, drag, locked],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  const value = useContext(MotionContext);
  if (!value) {
    throw new Error('useMotion must be used within SheetMotionProvider');
  }
  return value;
}
