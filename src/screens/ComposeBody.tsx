import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useMemo } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { Easing, runOnJS, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

import { type Draft, updateDraft, useDrafts } from '../navigation/draftStore';
import { MOTION_DURATION, dismissTravel } from '../navigation/sheetLayout';
import { requestCloseTop, useMotion } from '../navigation/sheetMotion';
import { FROM_EMAIL, colors } from '../theme';

export function ComposeBody({ draft }: { draft: Draft }) {
  const drafts = useDrafts();
  const front = drafts[drafts.length - 1]?.id === draft.id;
  const { presented, drag, locked } = useMotion();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const pan = usePanGesture({
    enabled: front,
    activeOffsetY: 12,
    failOffsetX: [-28, 28],
    onBegin: () => {
      'worklet';
      if (!locked.value) {
        runOnJS(Keyboard.dismiss)();
      }
    },
    onUpdate: (event) => {
      'worklet';
      if (locked.value) return;
      const travel = dismissTravel(height, insets.top, presented.value);
      const next = event.translationY <= 0 ? 0 : event.translationY / travel;
      drag.value = Math.min(1, next);
    },
    onDeactivate: (event) => {
      'worklet';
      if (locked.value) return;
      const velocityY = event.velocityY ?? 0;
      const shouldClose =
        !event.canceled && (drag.value > 0.28 || velocityY > 1100);
      if (shouldClose) {
        runOnJS(requestCloseTop)();
        return;
      }
      drag.value = withTiming(0, {
        duration: MOTION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    },
  });

  const setField = useMemo(
    () => (patch: Partial<Omit<Draft, 'id'>>) => updateDraft(draft.id, patch),
    [draft.id],
  );

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={front}
      >
        <View style={styles.header}>
          <GestureDetector gesture={pan}>
            <View style={styles.dragHandle} accessibilityRole="header">
              <Text style={styles.title}>新邮件</Text>
            </View>
          </GestureDetector>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="关闭新邮件"
            testID="compose-close"
            hitSlop={10}
            onPress={requestCloseTop}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          scrollEnabled={front}
          contentContainerStyle={styles.content}
        >
          <Field
            label="收件人："
            value={draft.to}
            onChangeText={(to) => setField({ to })}
            keyboardType="email-address"
          />
          {draft.extrasOpen ? (
            <>
              <Field
                label="抄送："
                value={draft.cc}
                onChangeText={(cc) => setField({ cc })}
                keyboardType="email-address"
              />
              <Field
                label="密送："
                value={draft.bcc}
                onChangeText={(bcc) => setField({ bcc })}
                keyboardType="email-address"
              />
            </>
          ) : null}
          <View style={styles.fromRow}>
            <Pressable
              hitSlop={6}
              onPress={() => setField({ extrasOpen: !draft.extrasOpen })}
            >
              <Text style={styles.label}>抄送/密送</Text>
            </Pressable>
            <Text style={styles.label}>, 发件人：</Text>
            <Text numberOfLines={1} style={styles.email}>
              {FROM_EMAIL}
            </Text>
          </View>
          <View style={styles.hairline} />
          <Field
            label="主题："
            value={draft.subject}
            onChangeText={(subject) => setField({ subject })}
          />
          <Text style={styles.signature}>发自我的 iPhone</Text>
          <TextInput
            value={draft.body}
            onChangeText={(body) => setField({ body })}
            multiline
            editable={front}
            placeholder=""
            style={styles.body}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'email-address' | 'default';
}) {
  return (
    <>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType ?? 'default'}
        />
      </View>
      <View style={styles.hairline} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.card,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 54,
    justifyContent: 'center',
  },
  dragHandle: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    position: 'absolute',
    left: 8,
    top: 5,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pressed: {
    opacity: 0.45,
  },
  content: {
    paddingBottom: 120,
  },
  fieldRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 17,
    color: colors.secondary,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    paddingVertical: 12,
  },
  fromRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  email: {
    flexShrink: 1,
    fontSize: 17,
    color: colors.text,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  body: {
    minHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 17,
    color: colors.text,
  },
  signature: {
    marginTop: 18,
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
});
