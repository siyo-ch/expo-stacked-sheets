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

function progressOf(presented: SharedValue<number>, drag: SharedValue<number>) {
  'worklet';
  return Math.max(0, presented.value - drag.value);
}

function useFrameStyle(
  index: number,
  presented: SharedValue<number>,
  drag: SharedValue<number>,
  height: number,
  topInset: number,
) {
  return useAnimatedStyle(() => {
    const frame = sheetFrame({
      presented: progressOf(presented, drag),
      index,
      height,
      topInset,
    });
    // Screen-space top keeps the rise vertical. rotateX is only the resting lean.
    return {
      top: frame.top + frame.hidden,
      height: frame.face,
      left: frame.inset,
      right: frame.inset,
      borderTopLeftRadius: frame.radius,
      borderTopRightRadius: frame.radius,
      backgroundColor: `rgba(255,255,255,${frame.fill})`,
      transform: [
        { perspective: frame.perspective },
        { rotateX: `${frame.rotateX}deg` },
        { scale: frame.scale },
      ],
      shadowOpacity: frame.radius > 1 ? 0.2 : 0,
    };
  });
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
    const frame = sheetFrame({
      presented: progressOf(presented, drag),
      index,
      height,
      topInset: insets.top,
    });
    return {
      borderTopLeftRadius: frame.radius,
      borderTopRightRadius: frame.radius,
    };
  });
  const fadeStyle = useAnimatedStyle(() => {
    const frame = sheetFrame({
      presented: progressOf(presented, drag),
      index,
      height,
      topInset: insets.top,
    });
    const band = Math.max(frame.peek, 1);
    return {
      top: band * 0.28,
      height: band * 0.86,
      opacity: frame.dim,
    };
  });

  return (
    <Animated.View
      testID={`sheet-${index}`}
      collapsable={false}
      pointerEvents={front ? 'auto' : 'none'}
      accessibilityElementsHidden={!front}
      importantForAccessibility={front ? 'auto' : 'no-hide-descendants'}
      style={[
        styles.outer,
        { zIndex: index, elevation: index === 0 ? 2 : 10 },
        frameStyle,
      ]}
    >
      <Animated.View style={[styles.inner, clipStyle]}>
        {children}
        <Animated.View pointerEvents="none" style={[styles.fade, fadeStyle]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    borderCurve: 'continuous',
    transformOrigin: 'top center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
    borderCurve: 'continuous',
    backgroundColor: 'transparent',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundImage:
      'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(214,214,218,0.42) 34%, rgba(154,154,160,0.94) 100%)',
  },
});
