import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
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
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import {
  SPRING,
  clamp,
  mixEditorFrames,
  paperTransforms,
  shouldMinimize,
} from './sheetLayout';
import { useDraft, useMailView, useMotion, useSheetController } from './sheetMotion';
import { SheetDockContent } from './SheetDockContent';
import { SheetControlIcon } from './StackedCard';
import type { SheetContent, StackedSheetsProps } from './types';

const android = Platform.OS === 'android';

function dismissKeyboard() {
  Keyboard.dismiss();
}

/** One editor shell is reused across sheets. Other sheets render lightweight previews. */
export function SheetEditor({
  id,
  draftCount,
  emptyTitle,
  renderEditor,
  onSaveSheet,
  renderIcon,
}: {
  id: string | null;
  draftCount: number;
  emptyTitle: string;
} & Pick<StackedSheetsProps, 'renderEditor' | 'renderIcon' | 'onSaveSheet'>) {
  const sheet = useDraft(id ?? '');
  const { closeDraft, isEditing, minimizeCompose, requestCloseTop, store } = useSheetController();
  const { mode } = useMailView();
  const { editor, frame, dock, full } = useMotion();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const top = insets.top + 4;
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);
  const dragStart = useSharedValue(full);
  const [readyId, setReadyId] = useState<string | null>(null);
  const [saveErrorId, setSaveErrorId] = useState<string | null>(null);
  const customEditor = !!renderEditor;
  const onReady = (nextId: string | null) => {
    if (!nextId || !isEditing(nextId)) {
      setReadyId(null);
      return;
    }
    if (customEditor) {
      setReadyId(nextId);
      return;
    }
    // Existing content opens for reading. Focus the title on blank sheets.
    const current = store.getDraft(nextId);
    if (current && !current.title && !current.body && !current.image)
      titleRef.current?.focus();
  };
  useAnimatedReaction(
    () => mode === 'compose' && editor.value >= 0.98 ? id : null,
    (nextId, previousId) => {
      if (nextId !== previousId) scheduleOnRN(onReady, nextId);
    },
  );
  const update = useCallback((changes: Partial<SheetContent>) => {
    if (id) store.updateDraft(id, changes);
  }, [id, store]);
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
      scheduleOnRN(dismissKeyboard);
    },
    onUpdate: (event) => {
      'worklet';
      const distance = Math.max(1, dock.top - dragStart.value.top);
      frame.set(mixEditorFrames(dragStart.value, dock, event.translationY / distance));
    },
    onDeactivate: (event) => {
      'worklet';
      if (shouldMinimize(event.translationY, event.velocityY ?? 0, !!event.canceled))
        scheduleOnRN(minimizeCompose);
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
      transform: paperTransforms(android, f.top, f.cosine, f.taper),
    };
  });
  // Content keeps its full-screen layout; the paper frame clips it while it morphs.
  const contentStyle = useAnimatedStyle(() => ({
    left: (frame.value.width - width) / 2,
    opacity: clamp((frame.value.progress - 0.22) / 0.56, 0, 1),
  }));
  // Match the real dock before the editor paper disappears at the end of the spring.
  const compactStyle = useAnimatedStyle(() => ({
    opacity: clamp(frame.value.compact / 0.96, 0, 1)
      * clamp((0.28 - frame.value.progress) / 0.24, 0, 1),
  }));
  const compactControlsStyle = useAnimatedStyle(() => ({
    opacity: clamp((0.12 - frame.value.progress) / 0.1, 0, 1),
  }));
  const title = sheet?.title ?? '';
  const image = sheet?.image;
  const canSave = Boolean(title.trim() || sheet?.body.trim() || image);

  const saveSheet = () => {
    if (!id || !isEditing(id) || !onSaveSheet) return;
    const current = store.getDraft(id);
    if (!current || !(current.title.trim() || current.body.trim() || current.image)) return;
    try {
      if (!onSaveSheet(current)) {
        setSaveErrorId(id);
        return;
      }
    } catch {
      setSaveErrorId(id);
      return;
    }
    setSaveErrorId(null);
    closeDraft(id);
  };

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
                  accessibilityLabel="Minimize sheet"
                  testID="compose-minimize"
                  hitSlop={10}
                  onPress={(event) => {
                    if (Platform.OS === 'web')
                      (event.currentTarget as unknown as { blur?: () => void }).blur?.();
                    minimizeCompose();
                  }}
                  style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
                >
                  <SheetControlIcon name="minimize" size={22} renderIcon={renderIcon} />
                </Pressable>
                <View style={styles.toolbarActions}>
                  {onSaveSheet && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Save note"
                      testID="compose-save"
                      disabled={!canSave}
                      onPress={saveSheet}
                      style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
                    >
                      <Text style={[styles.saveLabel, !canSave && styles.saveDisabled]}>Save</Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close sheet"
                    testID="compose-close"
                    hitSlop={10}
                    onPress={requestCloseTop}
                    style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
                  >
                    <SheetControlIcon name="close" size={22} renderIcon={renderIcon} />
                  </Pressable>
                </View>
              </View>
              {saveErrorId && saveErrorId === id && (
                <Text accessibilityRole="alert" style={styles.saveError}>Couldn’t save the note. Try again.</Text>
              )}
            </View>
          </GestureDetector>
          {renderEditor ? (
            sheet && (
              <View key={sheet.id} style={styles.flex}>
                {renderEditor({ sheet, update, ready: mode === 'compose' && readyId === id })}
              </View>
            )
          ) : (
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
                onChangeText={(nextTitle) => update({ title: nextTitle })}
                style={styles.title}
                multiline
                submitBehavior="blurAndSubmit"
              />
              {image && (
                <View style={styles.photoFrame}>
                  <Image
                    source={image.source}
                    accessible
                    accessibilityLabel={image.label}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </View>
              )}
              <TextInput
                accessibilityLabel="Body"
                placeholder="Start writing…"
                placeholderTextColor={MUTED}
                value={sheet?.body ?? ''}
                onChangeText={(body) => update({ body })}
                multiline
                style={styles.body}
                textAlignVertical="top"
              />
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        aria-hidden
        accessibilityElementsHidden
        style={[styles.compact, compactStyle]}
      >
        <SheetDockContent
          title={title || emptyTitle}
          count={draftCount}
          renderIcon={renderIcon}
          controlsStyle={compactControlsStyle}
        />
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
  compact: { ...StyleSheet.absoluteFill },
  header: { paddingBottom: 4 },
  handleButton: { height: 20, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 36, height: 5, borderRadius: 3, backgroundColor: '#E0E0E0' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 22 },
  saveLabel: { color: INK, fontSize: 16, fontWeight: '600' },
  saveDisabled: { color: MUTED },
  saveError: { color: '#A62828', paddingHorizontal: 24, paddingTop: 4 },
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
