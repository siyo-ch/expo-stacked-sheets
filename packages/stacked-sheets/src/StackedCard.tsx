import { memo, useEffect } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  CARD_INSET,
  CARD_RADIUS,
  SPRING,
  clamp,
  deckFrame,
  paperTransforms,
  shouldDismissCard,
} from './sheetLayout';
import { useDraft, useMailView, useMotion, useSheetController } from './sheetMotion';
import type { Sheet, SheetIcon, StackedSheetsProps } from './types';

const android = Platform.OS === 'android';

const iconGlyphs = {
  sheet: '▤',
  expand: '⌃',
  minimize: '⌄',
  close: '×',
} satisfies Record<SheetIcon, string>;

export function SheetControlIcon({
  name,
  size,
  renderIcon,
}: {
  name: SheetIcon;
  size: number;
  renderIcon: StackedSheetsProps['renderIcon'];
}) {
  if (renderIcon) return renderIcon(name, size);
  return (
    <Text style={[styles.icon, { fontSize: size }]}>{iconGlyphs[name]}</Text>
  );
}

/** Overview cards contain lightweight previews, never mounted text editors. */
export const StackedCard = memo(function StackedCard({
  id,
  index,
  emptyTitle,
  renderIcon,
  renderPreview,
}: {
  id: string;
  index: number;
  emptyTitle: string;
} & Pick<StackedSheetsProps, 'renderIcon' | 'renderPreview'>) {
  const { width, height } = useWindowDimensions();
  const { closeDraft, selectDraft } = useSheetController();
  const sheet = useDraft(id);
  const { overview, scroll, count: animatedCount, dock } = useMotion();
  const { mode } = useMailView();
  const slot = useSharedValue(index);
  useEffect(() => {
    slot.set(withSpring(index, SPRING));
  }, [slot, index]);
  const horizontal = useSharedValue(0);
  const closing = useSharedValue(false);
  const gestureStart = useSharedValue(0);
  const pan = usePanGesture({
    enabled: mode === 'overview',
    activeOffsetX: [-12, 12],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      if (!closing.value) {
        cancelAnimation(horizontal);
        gestureStart.value = horizontal.value;
      }
    },
    onUpdate: (event) => {
      'worklet';
      if (!closing.value) horizontal.value = gestureStart.value + event.translationX;
    },
    onDeactivate: (event) => {
      'worklet';
      if (closing.value) return;
      if (
        shouldDismissCard(
          horizontal.value,
          event.velocityX ?? 0,
          width,
          !!event.canceled,
        )
      ) {
        closing.value = true;
        // Finish the semantic dismissal promptly. Waiting for a spring's
        // invisible settling tail leaves a vacant slot before reflow starts.
        horizontal.value = withTiming(
          horizontal.value < 0 ? -width * 1.2 : width * 1.2,
          { duration: 180, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) scheduleOnRN(closeDraft, id);
          },
        );
      } else
        horizontal.value = withSpring(0, { ...SPRING, velocity: event.canceled ? 0 : event.velocityX ?? 0 });
    },
  });
  const positionStyle = useAnimatedStyle(() => {
    const frame = deckFrame(slot.value, animatedCount.value, height, scroll.value);
    const p = clamp(overview.value, 0, 1);
    return {
      opacity: p,
      left: 16 + (CARD_INSET - 16) * p,
      right: 16 + (CARD_INSET - 16) * p,
      height: dock.height + (height + 160 - dock.height) * p,
      transform: [
        { translateX: horizontal.value },
        { translateY: dock.top + (frame.top - dock.top) * p },
      ],
    };
  });
  const paperStyle = useAnimatedStyle(() => {
    const frame = deckFrame(slot.value, animatedCount.value, height, scroll.value);
    const p = clamp(overview.value, 0, 1);
    return {
      borderRadius: dock.radius + (CARD_RADIUS - dock.radius) * p,
      transform: paperTransforms(android, 0, 1 + (frame.cosine - 1) * p, frame.taper * p),
    };
  });
  const openButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open sheet ${index}`}
      onPress={() => selectDraft(id)}
      style={StyleSheet.absoluteFill}
    />
  );
  const closeButton = (
    <Pressable
      testID={`draft-close-${id}`}
      accessibilityRole="button"
      accessibilityLabel={`Close sheet ${index}`}
      onPress={() => {
        if (closing.value) return;
        closing.value = true;
        horizontal.set(
          withTiming(
            -width * 1.2,
            { duration: 180, easing: Easing.out(Easing.cubic) },
            (finished) => {
              if (finished) scheduleOnRN(closeDraft, id);
            },
          ),
        );
      }}
      style={styles.closeHit}
      hitSlop={4}
    >
      {android && <SheetControlIcon name="close" size={22} renderIcon={renderIcon} />}
    </Pressable>
  );

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        testID={`draft-card-${id}`}
        collapsable={false}
        pointerEvents={android ? 'box-none' : 'auto'}
        style={[
          styles.position,
          { height: height + 160, zIndex: index },
          positionStyle,
        ]}
      >
        {/* Android hit-tests its native camera transform. UIKit's matrix
            projection uses the flat wrapper for touch targets. */}
        <Animated.View
          pointerEvents={android ? 'box-none' : 'none'}
          style={[styles.paper, paperStyle]}
        >
          <View
            pointerEvents="none"
            aria-hidden
            importantForAccessibility="no-hide-descendants"
            style={styles.preview}
          >
            <View style={styles.header}>
              {!android && <SheetControlIcon name="close" size={22} renderIcon={renderIcon} />}
            </View>
            {sheet && (
              renderPreview ? (
                <View style={styles.preview}>{renderPreview(sheet)}</View>
              ) : (
                <SheetPreview sheet={sheet} emptyTitle={emptyTitle} />
              )
            )}
          </View>
          <View pointerEvents="none" style={styles.shade} />
          {android && openButton}
          {android && closeButton}
        </Animated.View>
        {!android && openButton}
        {!android && closeButton}
      </Animated.View>
    </GestureDetector>
  );
});
function SheetPreview({ sheet, emptyTitle }: { sheet: Sheet; emptyTitle: string }) {
  const { title, body, image } = sheet;
  return (
    <View style={styles.content}>
      <Text numberOfLines={1} style={styles.title}>
        {title || emptyTitle}
      </Text>
      <View style={styles.excerpt}>
        <Text numberOfLines={image ? 5 : 6} style={styles.body}>
          {body}
        </Text>
        {image && <Image source={image.source} style={styles.photo} resizeMode="cover" />}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  position: { position: 'absolute', top: 0, left: CARD_INSET, right: CARD_INSET },
  icon: { color: '#111', textAlign: 'center' },
  closeHit: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: 48,
    height: 48,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    ...StyleSheet.absoluteFill,
    borderRadius: CARD_RADIUS,
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    transformOrigin: '50% 0%',
    overflow: 'hidden',
  },
  header: { height: 48, alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 22 },
  preview: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: '#111' },
  excerpt: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 10 },
  body: { flex: 1, fontSize: 15, lineHeight: 23, color: '#555' },
  photo: { width: '36%', maxWidth: 148, aspectRatio: 3 / 2, borderRadius: 8 },
  // Deepens each card's lower half so the next card's top edge reads on white.
  shade: {
    ...StyleSheet.absoluteFill,
    backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.06) 100%)',
  },
});
