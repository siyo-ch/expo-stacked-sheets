import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { notePhotos } from '../data/notePhotos';
import type { Note } from '../data/notes';

export function InboxBody({
  active,
  notes,
  onNewDraft,
  onOpenNote,
}: {
  active: boolean;
  notes: readonly Note[];
  onNewDraft: () => void;
  onOpenNote: (noteId: string) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      scrollEnabled={active}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 140 }}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Notes
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New draft"
          testID="compose-fab"
          disabled={!active}
          hitSlop={8}
          onPress={onNewDraft}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={22} color="#111" />
        </Pressable>
      </View>
      <Text style={styles.count}>{notes.length} notes</Text>
      <View style={styles.list}>
        {notes.map((note, index) => (
          <Row
            key={note.id}
            note={note}
            last={index === notes.length - 1}
            disabled={!active}
            onPress={() => onOpenNote(note.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function Row({
  note,
  last,
  disabled,
  onPress,
}: {
  note: Note;
  last: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const photo = notePhotos[note.id];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${note.title}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.rowPressed}
    >
      <View style={styles.row}>
        <View style={styles.rowCopy}>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {note.title}
          </Text>
          <Text numberOfLines={1} style={styles.rowExcerpt}>
            {note.body.replace(/\n+/g, ' ')}
          </Text>
          <Text style={styles.rowDate}>{note.date}</Text>
        </View>
        {photo && <Image source={photo.source} style={styles.thumbnail} resizeMode="cover" />}
      </View>
      {!last && <View style={styles.separator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  title: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: -0.6, color: '#111' },
  add: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.5 },
  count: { paddingHorizontal: 20, marginTop: 4, fontSize: 15, color: '#8E8E93' },
  list: { marginTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  rowPressed: { backgroundColor: '#F6F6F6' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 17, fontWeight: '600', color: '#111' },
  rowExcerpt: { marginTop: 3, fontSize: 14, color: '#626268' },
  rowDate: { marginTop: 4, fontSize: 12, color: '#737378' },
  thumbnail: { width: 48, height: 48, borderRadius: 8 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8E8E8', marginLeft: 20 },
});
