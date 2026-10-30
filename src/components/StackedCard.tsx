import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

import { useDrafts } from '../navigation/draftStore';
import { sheetFrame } from '../navigation/sheetLayout';
import { useMotion } from '../navigation/sheetMotion';
import { colors } from '../theme';

const HAIRLINE = StyleSheet.hairlineWidth;

function useFrameStyle(
  index: number,
  presented: SharedValue<number>,
  drag: SharedValue<number>,
  height: number,
  topInset: number,
) {
  return useAnimatedStyle(() => {
    const progress = Math.max(0, presented.value - drag.value);
    const frame = sheetFrame({
      presented: progress,
      index,
      height,
      topInset,
    });
    // Shift top and bottom together so the sheet slides without squashing,
    // and the settled card always reaches the bottom of the screen.
    const offset = frame.top + frame.hidden;
    return {
      top: offset,
      bottom: -frame.hidden,
      borderRadius: frame.radius,
      borderWidth: frame.radius > 0.5 ? HAIRLINE : 0,
      transform: [{ scale: frame.scale }],
      opacity: index === 0 || frame.appear > 0.03 ? 1 : 0,
      shadowOpacity: frame.radius > 1 ? 0.18 : 0,
    };
  }, [drag, height, index, presented, topInset]);
}

export function StackedCard({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const drafts = useDrafts();
  const { presented, drag } = useMotion();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const front = index === drafts.length;
  const frameStyle = useFrameStyle(index, presented, drag, height, insets.top);
  const clipStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, presented.value - drag.value);
    const frame = sheetFrame({
      presented: progress,
      index,
      height,
      topInset: insets.top,
    });
    return { borderRadius: frame.radius };
  }, [drag, height, index, insets.top, presented]);

  return (
    <Animated.View
      testID={`sheet-${index}`}
      collapsable={false}
      pointerEvents={front ? 'auto' : 'none'}
      accessibilityElementsHidden={!front}
      importantForAccessibility={front ? 'auto' : 'no-hide-descendants'}
      style={[
        styles.outer,
        { zIndex: index, elevation: 8 + index * 4, transformOrigin: 'top center' },
        frameStyle,
      ]}
    >
      <Animated.View style={[styles.inner, clipStyle]}>{children}</Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
});
