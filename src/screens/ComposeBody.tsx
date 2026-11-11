import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useEffect, useRef, type ComponentRef, type RefObject } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateDraft, useDraft } from '../navigation/draftStore';
import { SPRING, clamp, mixEditorFrames, paperTransform, shouldMinimize } from '../navigation/sheetLayout';
import {
  minimizeCompose,
  isEditing,
  requestCloseTop,
  useMailView,
  useMotion,
} from '../navigation/sheetMotion';
import { FROM_EMAIL, colors } from '../theme';
function dismissKeyboard() {
  Keyboard.dismiss();
}

/** One flat editor is pre-mounted and reused across drafts. Other drafts are overview previews. */
const EMPTY_DRAFT = {
  id: '',
  to: '',
  cc: '',
  bcc: '',
  subject: '',
  body: '',
  extrasOpen: false,
};
export function ComposeBody({ id }: { id: string | null }) {
  const draft = useDraft(id ?? '') ?? EMPTY_DRAFT;
  const { mode } = useMailView();
  const { editor, frame, dock, full } = useMotion();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const top = insets.top + 4;
  const toRef = useRef<ComponentRef<typeof TextInput>>(null);
  const bodyRef = useRef<ComponentRef<typeof TextInput>>(null);
  const lastFocus = useRef<ComponentRef<typeof TextInput> | null>(null);
  const previousId = useRef(id);
  const dragStart = useSharedValue(full);
  const focusEditor = () => {
    if (isEditing(id)) (lastFocus.current ?? toRef.current)?.focus();
  };
  useAnimatedReaction(
    () => editor.value >= 0.98,
    (ready, wasReady) => {
      if (ready && !wasReady) runOnJS(focusEditor)();
    },
  );
  useEffect(() => {
    if (previousId.current !== id) {
      lastFocus.current = null;
      previousId.current = id;
    }
    if (mode !== 'compose') return;
    // Keyboard layout starts once the sheet has arrived, rather than resizing
    // its contents during the shared-frame transition.
    frame.set(withSpring(full, SPRING));
  }, [mode, id, frame, full]);
  const pan = usePanGesture({
    enabled: mode === 'compose',
    activeOffsetY: 8,
    failOffsetX: [-24, 24],
    onActivate: () => {
      'worklet';
      cancelAnimation(frame);
      dragStart.value = frame.value;
      runOnJS(dismissKeyboard)();
    },
    onUpdate: (event) => {
      'worklet';
      const distance = Math.max(1, dock.top - dragStart.value.top);
      frame.set(mixEditorFrames(dragStart.value, dock, event.translationY / distance));
    },
    onDeactivate: (event) => {
      'worklet';
      if (shouldMinimize(event.translationY, event.velocityY ?? 0, !!event.canceled))
        runOnJS(minimizeCompose)();
      else
        frame.set(withSpring(full, SPRING));
    },
  });
  const style = useAnimatedStyle(() => {
    const f = frame.value;
    return {
      left: (width - f.width) / 2,
      width: f.width,
      height: f.height,
      borderRadius: f.radius,
      opacity: f.progress <= 0 ? 0 : 1,
      transform: [{ matrix: paperTransform(f.top, 0, f.cosine, f.taper) }],
    };
  });
  const contentStyle = useAnimatedStyle(() => ({
    left: (frame.value.width - width) / 2,
    opacity: clamp((frame.value.progress - 0.22) / 0.56, 0, 1),
  }));
  const compactStyle = useAnimatedStyle(() => ({
    opacity: frame.value.compact * clamp((0.28 - frame.value.progress) / 0.28, 0, 1),
  }));
  const field = (key: 'to' | 'cc' | 'bcc' | 'subject', label: string) => (
    <Field
      key={key}
      label={label}
      value={draft[key]}
      inputRef={key === 'to' ? toRef : undefined}
      onFocus={(input) => {
        lastFocus.current = input;
      }}
      email={key !== 'subject'}
      onChangeText={(value) => updateDraft(id ?? '', { [key]: value })}
    />
  );
  return (
    <Animated.View
      testID="compose-editor"
      pointerEvents={mode === 'compose' ? 'auto' : 'none'}
      aria-hidden={mode !== 'compose'}
      accessibilityElementsHidden={mode !== 'compose'}
      importantForAccessibility={mode === 'compose' ? 'auto' : 'no-hide-descendants'}
      style={[styles.root, style]}
    >
      <Animated.View style={[styles.editorContent, { width, height: height - top }, contentStyle]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.header}>
              <View style={styles.handleButton}>
                <View style={styles.handle} />
              </View>
              <View style={styles.toolbar}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="关闭新邮件"
                  testID="compose-close"
                  onPress={requestCloseTop}
                  style={styles.circle}
                >
                  <Ionicons name="close" size={26} color={colors.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="收起草稿"
                  testID="compose-minimize"
                  onPress={(event) => {
                    if (Platform.OS === 'web')
                      (event.currentTarget as unknown as { blur?: () => void }).blur?.();
                    minimizeCompose();
                  }}
                  style={styles.circle}
                >
                  <Ionicons name="chevron-down" size={23} color={colors.text} />
                </Pressable>
                <View
                  accessibilityLabel="发送（演示不连接邮件服务器）"
                  accessibilityState={{ disabled: true }}
                  style={[styles.circle, styles.send]}
                >
                  <Ionicons name="arrow-up" size={25} color="#C7C7CC" />
                </View>
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                新邮件
              </Text>
            </View>
          </GestureDetector>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.content}
          >
            {field('to', '收件人：')}
            {draft.extrasOpen && (
              <>
                {field('cc', '抄送：')}
                {field('bcc', '密送：')}
              </>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="展开或收起抄送和密送"
              onPress={() => updateDraft(id ?? '', { extrasOpen: !draft.extrasOpen })}
              style={styles.fromRow}
            >
              <Text style={styles.from} numberOfLines={1}>
                抄送 / 密送，发件人：{FROM_EMAIL}
              </Text>
            </Pressable>
            {field('subject', '主题：')}
            <TextInput
              ref={bodyRef}
              accessibilityLabel="邮件正文"
              onFocus={() => { lastFocus.current = bodyRef.current; }}
              value={draft.body}
              onChangeText={(body) => updateDraft(id ?? '', { body })}
              multiline
              style={styles.body}
              textAlignVertical="top"
            />
            <Text style={styles.signature}>发自我的 iPhone</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
      <Animated.View pointerEvents="none" aria-hidden accessibilityElementsHidden style={[styles.compact, compactStyle]}>
        <Text style={styles.compactTitle}>新邮件</Text>
      </Animated.View>
    </Animated.View>
  );
}
function Field({
  label,
  value,
  onChangeText,
  email,
  inputRef,
  onFocus,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  email?: boolean;
  inputRef?: RefObject<ComponentRef<typeof TextInput> | null>;
  onFocus: (input: ComponentRef<typeof TextInput> | null) => void;
}) {
  const ownRef = useRef<ComponentRef<typeof TextInput>>(null);
  const ref = inputRef ?? ownRef;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label.replace('：', '')}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => onFocus(ref.current)}
        autoCapitalize={email ? 'none' : 'sentences'}
        autoCorrect={!email}
        keyboardType={email ? 'email-address' : 'default'}
        style={styles.input}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    transformOrigin: '50% 0%',
  },
  editorContent: { position: 'absolute', top: 0 },
  compact: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  compactTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  flex: { flex: 1 },
  header: { backgroundColor: '#FFF' },
  handleButton: { height: 20, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 36, height: 5, borderRadius: 3, backgroundColor: '#C7C7CC' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  send: { marginLeft: 'auto' },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: '#111',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  field: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 17, color: '#8E8E93' },
  input: { flex: 1, minHeight: 48, paddingVertical: 10, fontSize: 17, color: '#111' },
  fromRow: {
    minHeight: 50,
    justifyContent: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  from: { color: '#8E8E93', fontSize: 14 },
  body: {
    minHeight: 44,
    fontSize: 17,
    color: '#111',
    paddingTop: 16,
    paddingBottom: 12,
  },
  signature: { fontSize: 17, color: '#111', marginTop: 8 },
});
