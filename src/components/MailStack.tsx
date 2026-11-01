import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDraftIds } from '../navigation/draftStore';
import {
  SPRING,
  deckFrame,
  deckMetrics,
  paperTransform,
} from '../navigation/sheetLayout';
import {
  dismissOverview,
  selectDraft,
  showOverview,
  useMailView,
  useMotion,
} from '../navigation/sheetMotion';
import { ComposeBody } from '../screens/ComposeBody';
import { InboxBody } from '../screens/InboxBody';
import { ComposeFab } from './ComposeFab';
import { StackedCard } from './StackedCard';

export function MailStack() {
  const ids = useDraftIds();
  const { mode, activeId } = useMailView();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { overview, scroll, editor, count } = useMotion();
  useEffect(() => {
    count.set(withSpring(ids.length, SPRING));
    const limit = deckMetrics(height, ids.length).maxScroll;
    if (scroll.value > limit) scroll.set(withSpring(limit, SPRING));
  }, [ids.length, height, count, scroll]);
  const start = useSharedValue(0);
  const { maxScroll } = deckMetrics(height, ids.length);
  const pan = usePanGesture({
    enabled: mode === 'overview',
    activeOffsetY: [-10, 10],
    failOffsetX: [-12, 12],
    onActivate: () => {
      'worklet';
      cancelAnimation(scroll);
      start.value = scroll.value;
    },
    onUpdate: (event) => {
      'worklet';
      const next = start.value - event.translationY;
      scroll.set(
        next < 0
          ? next * 0.24
          : next > maxScroll
            ? maxScroll + (next - maxScroll) * 0.24
            : next,
      );
    },
    onDeactivate: (event) => {
      'worklet';
      if (scroll.value < 0 || scroll.value > maxScroll || event.canceled) {
        scroll.set(withSpring(Math.max(0, Math.min(maxScroll, scroll.value)), SPRING));
      } else
        scroll.set(
          withDecay({
            velocity: -(event.velocityY ?? 0),
            clamp: [0, maxScroll],
            rubberBandEffect: true,
          }),
        );
    },
  });
  const inboxStyle = useAnimatedStyle(() => {
    const p = overview.value;
    const frame = deckFrame(0, count.value, height, scroll.value);
    return {
      transform: [
        {
          matrix: paperTransform(
            frame.top * p,
            0,
            1 + (frame.cosine - 1) * p,
            frame.taper * p,
            1 - 0.06 * p - 0.02 * editor.value,
          ),
        },
      ],
    };
  });
  const dimStyle = useAnimatedStyle(() => ({ opacity: editor.value * 0.18 }));
  const depthStyle = useAnimatedStyle(() => ({ opacity: overview.value }));
  const dockStyle = useAnimatedStyle(() => ({
    opacity: (1 - overview.value) * (1 - editor.value),
    transform: [{ translateY: overview.value * 90 + editor.value * 90 }],
  }));
  return (
    <View style={styles.root}>
      <StatusBar style={mode === 'overview' ? 'light' : 'dark'} animated />
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[styles.mailbox, inboxStyle]}
            pointerEvents={mode === 'inbox' ? 'auto' : 'none'}
            aria-hidden={mode !== 'inbox'}
            accessibilityElementsHidden={mode !== 'inbox'}
            importantForAccessibility={
              mode === 'inbox' ? 'auto' : 'no-hide-descendants'
            }
          >
            <InboxBody />
            <Animated.View pointerEvents="none" style={[styles.dim, dimStyle]} />
            <Animated.View
              pointerEvents="none"
              style={[styles.depthShade, depthStyle]}
            />
          </Animated.View>
          {mode === 'overview' && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="返回收件箱"
                onPress={dismissOverview}
                style={StyleSheet.absoluteFill}
              />
              {ids.map((id, index) => (
                <StackedCard key={id} id={id} index={index + 1} />
              ))}
            </>
          )}
        </View>
      </GestureDetector>
      <Animated.View
        pointerEvents="none"
        style={[styles.statusBarCover, { height: insets.top }, depthStyle]}
      />
      {mode === 'inbox' && <ComposeFab bottomOffset={ids.length ? 68 : 0} />}
      {ids.length > 0 && (
        <Animated.View
          pointerEvents={mode === 'inbox' ? 'auto' : 'none'}
          aria-hidden={mode !== 'inbox'}
          accessibilityElementsHidden={mode !== 'inbox'}
          style={[styles.dock, { bottom: Math.max(insets.bottom, 8) }, dockStyle]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              ids.length === 1 ? '继续编辑草稿' : `查看 ${ids.length} 份草稿`
            }
            onPress={(event) => {
              if (Platform.OS === 'web')
                (event.currentTarget as unknown as { blur?: () => void }).blur?.();
              if (ids.length === 1) selectDraft(ids[0]);
              else showOverview();
            }}
            onLongPress={showOverview}
            style={styles.dockButton}
          >
            <Text style={styles.dockTitle}>
              新邮件{ids.length > 1 ? `（${ids.length}）` : ''}
            </Text>
          </Pressable>
        </Animated.View>
      )}
      <ComposeBody id={activeId} />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  mailbox: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFF',
    borderRadius: 28,
    overflow: 'hidden',
    transformOrigin: '50% 0%',
  },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  depthShade: {
    ...StyleSheet.absoluteFill,
    backgroundImage:
      'linear-gradient(to bottom, rgba(0,0,0,0) 12%, rgba(0,0,0,0.38) 68%, rgba(0,0,0,0.38) 100%)',
  },
  statusBarCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#000',
  },
  dock: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF',
  },
  dockButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dockTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
});
