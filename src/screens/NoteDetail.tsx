import { Image, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { notePhotos } from '../data/notePhotos';
import type { Note } from '../data/notes';

export function NoteDetail({ note }: { note: Note | undefined }) {
  const isDark = useColorScheme() === 'dark';
  const titleColor = isDark ? '#F5F5F7' : '#111';
  const dateColor = isDark ? '#8E8E93' : '#737378';
  const bodyColor = isDark ? '#D1D1D6' : '#333';

  if (!note) return <Text style={[styles.content, { color: bodyColor }]}>Note not found.</Text>;

  const photo = notePhotos[note.id];

  return (
    <ScrollView testID="note-detail" contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { color: titleColor }]}>{note.title}</Text>
      <Text style={[styles.date, { color: dateColor }]}>{note.date}</Text>
      {photo && (
        <View style={styles.photoFrame}>
          <Image
            source={photo.source}
            accessible
            accessibilityLabel={photo.label}
            resizeMode="cover"
            style={styles.photo}
          />
        </View>
      )}
      <Text style={[styles.body, { color: bodyColor }]}>{note.body}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  title: { color: '#111', fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  date: { color: '#737378', fontSize: 14, marginTop: 6 },
  photoFrame: { width: '100%', aspectRatio: 3 / 2, borderRadius: 12, marginTop: 20, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  body: { color: '#333', fontSize: 17, lineHeight: 27, marginTop: 20 },
});
