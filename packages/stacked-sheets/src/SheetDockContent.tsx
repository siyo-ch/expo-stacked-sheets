import { StyleSheet, Text, View } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { SheetControlIcon } from './StackedCard';
import type { StackedSheetsProps } from './types';

export function SheetDockContent({
  title,
  count,
  renderIcon,
  controlsStyle,
}: Pick<StackedSheetsProps, 'renderIcon'> & {
  title: string;
  count: number;
  controlsStyle?: AnimatedStyle<{ opacity: number }>;
}) {
  const hasStack = count > 1;

  return (
    <View pointerEvents="none" style={styles.row}>
      <View style={[styles.titleInset, hasStack && styles.stackTitleInset]}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
      </View>
      <Animated.View style={[styles.controls, controlsStyle]}>
        <SheetControlIcon name="sheet" size={20} renderIcon={renderIcon} />
        {hasStack && (
          <View style={styles.trailing}>
            <View style={styles.pill}>
              <Text numberOfLines={1} style={styles.count}>{count}</Text>
            </View>
            <SheetControlIcon name="expand" size={18} renderIcon={renderIcon} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, justifyContent: 'center' },
  titleInset: { paddingHorizontal: 50 },
  stackTitleInset: { paddingHorizontal: 94 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#111' },
  controls: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  trailing: { maxWidth: 64, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: {
    height: 26,
    minWidth: 26,
    flexShrink: 1,
    paddingHorizontal: 6,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  count: { color: '#111', fontSize: 13, fontWeight: '500' },
});
