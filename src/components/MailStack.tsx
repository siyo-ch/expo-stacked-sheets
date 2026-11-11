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
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useDraft, useDraftIds } from '../navigation/draftStore';
import {
  SPRING,
  deckFrame,
  deckMetrics,
  paperTransforms,
  clamp,
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
import { StackedCard } from './StackedCard';

const android = Platform.OS === 'android';

export function MailStack() {
  const ids = useDraftIds();
  const { mode, activeId } = useMailView();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // The reference's capsule includes the home-indicator area, rather than
  // floating above the safe area. Leave a black seam below the shortened inbox.
  const { overview, scroll, editor, count, dock } = useMotion();
  const dockHeight = dock.height;
  const dockBottom = height - dock.top - dock.height;
  const topNote = useDraft(ids.at(-1) ?? '');
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
    const p = clamp(overview.value, 0, 1);
    const frame = deckFrame(0, count.value, height, scroll.value);
    return {
      bottom: (dockHeight + dockBottom + 6) * clamp(count.value, 0, 1),
      borderBottomLeftRadius: 28 + 12 * clamp(count.value, 0, 1),
      borderBottomRightRadius: 28 + 12 * clamp(count.value, 0, 1),
      transform: paperTransforms(
        android,
        frame.top * p,
        1 + (frame.cosine - 1) * p,
        frame.taper * p,
        1 - 0.06 * p - 0.02 * editor.value,
      ),
    };
  });
  const dimStyle = useAnimatedStyle(() => ({ opacity: editor.value * 0.06 }));
  const depthStyle = useAnimatedStyle(() => ({ opacity: overview.value }));
  const dockStyle = useAnimatedStyle(() => ({
    opacity: 1 - clamp(overview.value, 0, 1),
  }));
  return (
    <View style={styles.root}>
      <StatusBar style={mode === 'overview' ? 'light' : 'dark'} animated />
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.mailbox,
              inboxStyle,
            ]}
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
          <View
            style={StyleSheet.absoluteFill}
            pointerEvents={mode === 'overview' ? 'box-none' : 'none'}
            aria-hidden={mode !== 'overview'}
            accessibilityElementsHidden={mode !== 'overview'}
            importantForAccessibility={mode === 'overview' ? 'auto' : 'no-hide-descendants'}
          >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to notes"
                onPress={dismissOverview}
                style={StyleSheet.absoluteFill}
                pointerEvents={mode === 'overview' ? 'auto' : 'none'}
              />
              {ids.map((id, index) => (
                <StackedCard key={id} id={id} index={index + 1} />
              ))}
          </View>
        </View>
      </GestureDetector>
      <Animated.View
        pointerEvents="none"
        style={[styles.statusBarCover, { height: insets.top }, depthStyle]}
      />
      {ids.length > 0 && (
        <Animated.View
          pointerEvents={mode === 'inbox' ? 'auto' : 'none'}
          aria-hidden={mode !== 'inbox'}
          accessibilityElementsHidden={mode !== 'inbox'}
          style={[
            styles.dock,
            { top: dock.top, height: dock.height, borderRadius: dock.radius },
            dockStyle,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            testID="draft-dock"
            accessibilityLabel={
              ids.length === 1 ? 'Resume note' : `View ${ids.length} open notes`
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
            <Ionicons name="document-text-outline" size={20} color="#111" />
            <Text numberOfLines={1} style={styles.dockTitle}>
              {topNote?.subject || 'New Note'}
            </Text>
            {ids.length > 1 && (
              <>
                <View style={styles.dockPill}>
                  <Text style={styles.dockPillText}>{ids.length}</Text>
                </View>
                <Ionicons name="chevron-up" size={18} color="#111" />
              </>
            )}
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 28,
    overflow: 'hidden',
    transformOrigin: '50% 0%',
  },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  depthShade: {
    ...StyleSheet.absoluteFill,
    backgroundImage:
      'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.06) 100%)',
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
    left: 16,
    right: 16,
    borderRadius: 999,
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  dockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 10,
  },
  dockTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111' },
  dockPill: {
    height: 26,
    minWidth: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  dockPillText: { fontSize: 13, fontWeight: '500', color: '#111' },
});
