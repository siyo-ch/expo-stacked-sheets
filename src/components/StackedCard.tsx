import { Ionicons } from '@react-native-vector-icons/ionicons';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDraft } from '../navigation/draftStore';
import {
  CARD_INSET,
  CARD_RADIUS,
  SPRING,
  deckFrame,
  paperTransform,
  shouldDismissCard,
} from '../navigation/sheetLayout';
import { closeDraft, selectDraft, useMotion } from '../navigation/sheetMotion';
import { FROM_EMAIL } from '../theme';

/** Overview cards contain lightweight previews, never mounted text editors. */
export const StackedCard = memo(function StackedCard({
  id,
  index,
}: {
  id: string;
  index: number;
}) {
  const { width, height } = useWindowDimensions();
  const { overview, scroll, count: animatedCount } = useMotion();
  const slot = useSharedValue(index);
  useEffect(() => {
    slot.set(withSpring(index, SPRING));
  }, [slot, index]);
  const horizontal = useSharedValue(0);
  const closing = useSharedValue(false);
  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      cancelAnimation(horizontal);
    },
    onUpdate: (event) => {
      'worklet';
      if (!closing.value) horizontal.value = event.translationX;
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
        horizontal.value = withSpring(
          horizontal.value < 0 ? -width * 1.2 : width * 1.2,
          { ...SPRING, velocity: event.velocityX ?? 0 },
          (finished) => {
            if (finished) runOnJS(closeDraft)(id);
          },
        );
      } else
        horizontal.value = withSpring(0, { ...SPRING, velocity: event.velocityX ?? 0 });
    },
  });
  const positionStyle = useAnimatedStyle(() => {
    const frame = deckFrame(slot.value, animatedCount.value, height, scroll.value);
    const p = overview.value;
    return {
      opacity: p,
      transform: [
        { translateX: horizontal.value },
        { translateY: frame.top + (1 - p) * height * 0.7 },
      ],
    };
  });
  const paperStyle = useAnimatedStyle(() => {
    const frame = deckFrame(slot.value, animatedCount.value, height, scroll.value);
    const p = overview.value;
    return {
      transform: [
        { matrix: paperTransform(0, 0, 1 + (frame.cosine - 1) * p, frame.taper * p) },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        testID={`draft-card-${id}`}
        collapsable={false}
        style={[
          styles.position,
          { height: height + 160, zIndex: index },
          positionStyle,
        ]}
      >
        {/* UIKit's perspective hit testing does not match the projected X.
            Keep visual projection non-interactive and hit-test in screen space. */}
        <Animated.View
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.paper, paperStyle]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>新邮件</Text>
          </View>
          <DraftPreview id={id} />
          <View style={styles.shade} />
          <View style={styles.close}>
            <Ionicons name="close" size={29} color="#111" />
          </View>
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`打开草稿 ${index}`}
          onPress={() => selectDraft(id)}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`关闭草稿 ${index}`}
          onPress={() => {
            if (closing.value) return;
            closing.value = true;
            horizontal.set(
              withSpring(-width * 1.2, SPRING, (finished) => {
                if (finished) runOnJS(closeDraft)(id);
              }),
            );
          }}
          style={styles.closeHit}
          hitSlop={4}
        />
      </Animated.View>
    </GestureDetector>
  );
});
function DraftPreview({ id }: { id: string }) {
  const draft = useDraft(id);
  if (!draft) return null;
  return (
    <View style={styles.fields}>
      <Text numberOfLines={1} style={styles.field}>
        收件人：{draft.to}
      </Text>
      <Text numberOfLines={1} style={styles.field}>
        抄送 / 密送，发件人：{FROM_EMAIL}
      </Text>
      <Text numberOfLines={1} style={styles.field}>
        主题：{draft.subject}
      </Text>
      <Text numberOfLines={5} style={styles.body}>
        {draft.body}
      </Text>
      <Text style={styles.signature}>发自我的 iPhone</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  position: { position: 'absolute', top: 0, left: CARD_INSET, right: CARD_INSET },
  closeHit: { position: 'absolute', top: 0, left: 12, width: 48, height: 48 },
  paper: {
    ...StyleSheet.absoluteFill,
    borderRadius: CARD_RADIUS,
    backgroundColor: '#FFF',
    transformOrigin: '50% 0%',
    overflow: 'hidden',
  },
  header: { height: 74, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#111' },
  close: {
    position: 'absolute',
    top: 7,
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAFAFA',
    borderColor: '#D8D8D8',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fields: { paddingHorizontal: 20 },
  field: {
    minHeight: 48,
    paddingVertical: 12,
    fontSize: 16,
    color: '#8E8E93',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDD',
  },
  body: { fontSize: 17, color: '#111', marginTop: 18 },
  signature: { fontSize: 17, color: '#111', marginTop: 12 },
  shade: {
    ...StyleSheet.absoluteFill,
    backgroundImage:
      'linear-gradient(to bottom, rgba(0,0,0,0) 4%, rgba(0,0,0,0.12) 16%, rgba(0,0,0,0.42) 48%, rgba(0,0,0,0.42) 100%)',
  },
});
