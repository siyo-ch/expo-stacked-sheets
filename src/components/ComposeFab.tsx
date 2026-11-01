import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openCompose } from '../navigation/sheetMotion';
import { colors } from '../theme';

export function ComposeFab({ bottomInset = 0 }: { bottomInset?: number }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="撰写新邮件"
      testID="compose-fab"
      onPress={openCompose}
      style={({ pressed }) => [
        styles.fab,
        { bottom: bottomInset ? bottomInset + 12 : Math.max(insets.bottom, 12) + 18 },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="create-outline" size={26} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 1000,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  pressed: {
    opacity: 0.82,
  },
});
