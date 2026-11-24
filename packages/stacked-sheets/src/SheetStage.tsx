import { useEffect } from 'react';
import {
  StyleSheet,
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
import {
  SPRING,
  deckFrame,
  deckMetrics,
  overviewCardOpacity,
  paperTransforms,
  clamp,
} from './sheetLayout';
import { SheetDockContent } from './SheetDockContent';
import { SheetEditor } from './SheetEditor';
import { useDraft, useDraftIds, useMailView, useMotion, useSheetController } from './sheetMotion';
import { useSheetTheme } from './sheetTheme';
import { StackedCard } from './StackedCard';
import type { StackedSheetsProps } from './types';

const android = Platform.OS === 'android';

export function SheetStage({
  renderBackground,
  renderStatusBar,
  renderPreview,
  renderEditor,
  onSaveSheet,
  renderIcon,
  emptyTitle = 'Untitled',
}: StackedSheetsProps) {
  const { openSheet, dismissOverview, selectDraft, showOverview } = useSheetController();
  const ids = useDraftIds();
  const { mode, activeId } = useMailView();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useSheetTheme();
  const dimOpacity = useSharedValue(theme.dimOpacity);
  useEffect(() => {
    dimOpacity.set(theme.dimOpacity);
  }, [dimOpacity, theme.dimOpacity]);
  const { overview, scroll, editor, count, dock } = useMotion();
  const dockHeight = dock.height;
  const dockBottom = height - dock.top - dock.height;
  const dockId = activeId && ids.includes(activeId) ? activeId : ids.at(-1);
  const dockSheet = useDraft(dockId ?? '');
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
  const dimStyle = useAnimatedStyle(() => ({ opacity: editor.value * dimOpacity.value }));
  const depthStyle = useAnimatedStyle(() => ({ opacity: overview.value }));
  const dockStyle = useAnimatedStyle(() => ({
    opacity: 1 - overviewCardOpacity(overview.value),
  }));
  return (
    <View style={[styles.root, { backgroundColor: theme.stage }]}>
      {renderStatusBar?.(mode, theme.colorScheme)}
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.background,
              { backgroundColor: theme.background, borderColor: theme.border },
              inboxStyle,
            ]}
            pointerEvents={mode === 'inbox' ? 'auto' : 'none'}
            aria-hidden={mode !== 'inbox'}
            accessibilityElementsHidden={mode !== 'inbox'}
            importantForAccessibility={
              mode === 'inbox' ? 'auto' : 'no-hide-descendants'
            }
          >
            {renderBackground({ active: mode === 'inbox', openSheet })}
            <Animated.View pointerEvents="none" style={[styles.dim, dimStyle]} />
            <Animated.View
              pointerEvents="none"
              style={[styles.depthShade, { backgroundImage: theme.depthShade }, depthStyle]}
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
                accessibilityLabel="Dismiss sheet overview"
                onPress={dismissOverview}
                style={StyleSheet.absoluteFill}
                pointerEvents={mode === 'overview' ? 'auto' : 'none'}
              />
              {ids.map((id, index) => (
                <StackedCard
                  key={id}
                  id={id}
                  index={index + 1}
                  emptyTitle={emptyTitle}
                  renderIcon={renderIcon}
                  renderPreview={renderPreview}
                />
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
            {
              top: dock.top,
              height: dock.height,
              borderRadius: dock.radius,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowOpacity: theme.shadowOpacity,
            },
            dockStyle,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            testID="draft-dock"
            accessibilityLabel={
              ids.length === 1 ? 'Resume sheet' : `View ${ids.length} open sheets`
            }
            onPress={(event) => {
              if (Platform.OS === 'web')
                (event.currentTarget as unknown as { blur?: () => void }).blur?.();
              if (ids.length === 1) selectDraft(ids[0]);
              else showOverview();
            }}
            onLongPress={showOverview}
            style={styles.fill}
          >
            <SheetDockContent
              title={dockSheet?.title || emptyTitle}
              count={ids.length}
              renderIcon={renderIcon}
            />
          </Pressable>
        </Animated.View>
      )}
      <SheetEditor
        id={activeId}
        draftCount={ids.length}
        emptyTitle={emptyTitle}
        renderEditor={renderEditor}
        onSaveSheet={onSaveSheet}
        renderIcon={renderIcon}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  background: {
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
  fill: { flex: 1 },
});
