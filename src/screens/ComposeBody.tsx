import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useEffect, useRef, type ComponentRef } from 'react';
import {
  Image,
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
import { notePhotos } from '../data/notePhotos';
import { getDraft, updateDraft, useDraft } from '../navigation/draftStore';
import {
  SPRING,
  clamp,
  mixEditorFrames,
  paperTransform,
  shouldMinimize,
} from '../navigation/sheetLayout';
import {
  isEditing,
  minimizeCompose,
  requestCloseTop,
  useMailView,
  useMotion,
} from '../navigation/sheetMotion';

function dismissKeyboard() {
  Keyboard.dismiss();
}

/** One flat editor is pre-mounted and reused across notes. Other notes are overview previews. */
export function ComposeBody({ id }: { id: string | null }) {
  const draft = useDraft(id ?? '');
  const { mode } = useMailView();
  const { editor, frame, dock, full } = useMotion();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const top = insets.top + 4;
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);
  const dragStart = useSharedValue(full);
  // Only a brand-new note grabs the keyboard; opening an existing one is for reading.
  const focusIfEmpty = () => {
    const current = getDraft(id ?? '');
    if (isEditing(id) && current && !current.subject && !current.body)
      titleRef.current?.focus();
  };
  useAnimatedReaction(
    () => editor.value >= 0.98,
    (ready, wasReady) => {
      if (ready && !wasReady) runOnJS(focusIfEmpty)();
    },
  );
  useEffect(() => {
    if (mode !== 'compose') return;
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
      else frame.set(withSpring(full, SPRING));
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
  // Content keeps its full-screen layout; the paper frame clips it while it morphs.
  const contentStyle = useAnimatedStyle(() => ({
    left: (frame.value.width - width) / 2,
    opacity: clamp((frame.value.progress - 0.22) / 0.56, 0, 1),
  }));
  const compactStyle = useAnimatedStyle(() => ({
    opacity: frame.value.compact * clamp((0.28 - frame.value.progress) / 0.28, 0, 1),
  }));
  const title = draft?.subject ?? '';
  const photo = notePhotos[draft?.sampleNoteId ?? ''];

  return (
    <Animated.View
      testID="compose-editor"
      pointerEvents={mode === 'compose' ? 'auto' : 'none'}
      aria-hidden={mode !== 'compose'}
      accessibilityElementsHidden={mode !== 'compose'}
      importantForAccessibility={mode === 'compose' ? 'auto' : 'no-hide-descendants'}
      style={[styles.root, style]}
    >
      <Animated.View
        style={[styles.editorContent, { width, height: height - top }, contentStyle]}
      >
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
                  accessibilityLabel="Minimize note"
                  testID="compose-minimize"
                  hitSlop={10}
                  onPress={(event) => {
                    if (Platform.OS === 'web')
                      (event.currentTarget as unknown as { blur?: () => void }).blur?.();
                    minimizeCompose();
                  }}
                  style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
                >
                  <Ionicons name="chevron-down" size={22} color={INK} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close note"
                  testID="compose-close"
                  hitSlop={10}
                  onPress={requestCloseTop}
                  style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
                >
                  <Ionicons name="close" size={22} color={INK} />
                </Pressable>
              </View>
            </View>
          </GestureDetector>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.content}
          >
            <TextInput
              ref={titleRef}
              accessibilityLabel="Title"
              placeholder="Title"
              placeholderTextColor={MUTED}
              value={title}
              onChangeText={(subject) => updateDraft(id ?? '', { subject })}
              style={styles.title}
              multiline
              submitBehavior="blurAndSubmit"
            />
            {photo && (
              <View style={styles.photoFrame}>
                <Image
                  source={photo.source}
                  accessible
                  accessibilityLabel={photo.label}
                  style={styles.photo}
                  resizeMode="cover"
                />
              </View>
            )}
            <TextInput
              accessibilityLabel="Note body"
              placeholder="Start writing…"
              placeholderTextColor={MUTED}
              value={draft?.body ?? ''}
              onChangeText={(body) => updateDraft(id ?? '', { body })}
              multiline
              style={styles.body}
              textAlignVertical="top"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        aria-hidden
        accessibilityElementsHidden
        style={[styles.compact, compactStyle]}
      >
        <Text numberOfLines={1} style={styles.compactTitle}>
          {title || 'New Note'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const INK = '#111';
const MUTED = '#B0B0B5';

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    transformOrigin: '50% 0%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  editorContent: { position: 'absolute', top: 0 },
  flex: { flex: 1 },
  compact: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  compactTitle: { fontSize: 16, fontWeight: '600', color: INK, paddingHorizontal: 24 },
  header: { paddingBottom: 4 },
  handleButton: { height: 20, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 36, height: 5, borderRadius: 3, backgroundColor: '#E0E0E0' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: '#F2F2F2' },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 60 },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: INK,
    padding: 0,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  body: {
    marginTop: 16,
    minHeight: 200,
    fontSize: 17,
    lineHeight: 27,
    color: '#333',
    padding: 0,
  },
});
