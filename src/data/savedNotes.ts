import { Directory, File, Paths } from 'expo-file-system';
import type { Sheet } from 'expo-stacked-sheets';
import { Platform } from 'react-native';
import type { Note } from './notes';

type SavedNote = Omit<Note, 'date'> & { savedAt: number };
const storagePrefix = 'stacked-sheets.note.';

function parseNote(json: string | null): SavedNote | undefined {
  if (json === null) return;
  try {
    const value = JSON.parse(json);
    if (
      value && typeof value.id === 'string' && typeof value.title === 'string' &&
      typeof value.body === 'string' && Number.isFinite(value.savedAt)
    ) return value;
  } catch {
    // An invalid record should not hide the other saved notes.
  }
}

export function loadSavedNotes(): SavedNote[] {
  const notes: SavedNote[] = [];
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return notes;
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(storagePrefix)) continue;
        const note = parseNote(localStorage.getItem(key));
        if (note) notes.push(note);
      }
    } else {
      const directory = new Directory(Paths.document, 'saved-notes');
      if (!directory.exists) return notes;
      for (const file of directory.list()) {
        if (!(file instanceof File) || !file.name.endsWith('.json')) continue;
        const note = parseNote(file.textSync());
        if (note) notes.push(note);
      }
    }
  } catch {
    // Storage can be unavailable at launch. Each save writes a separate record.
  }
  return notes.sort((a, b) => b.savedAt - a.savedAt);
}

export function saveDraftAsNote(sheet: Sheet, existingId?: string): SavedNote {
  const savedAt = Date.now();
  const id = existingId ?? `note-${savedAt.toString(36)}-${Math.random().toString(36).slice(2)}`;
  const note = { id, title: sheet.title.trim() || 'Untitled Note', body: sheet.body, savedAt };
  const json = JSON.stringify(note);

  if (Platform.OS === 'web') {
    const key = storagePrefix + id;
    if (localStorage.getItem(key) !== null) throw new Error('Note already saved');
    localStorage.setItem(key, json);
  } else {
    const directory = new Directory(Paths.document, 'saved-notes');
    directory.create({ idempotent: true, intermediates: true });
    const destination = new File(directory, `${id}.json`);
    if (destination.exists) throw new Error('Note already saved');
    // Only completed JSON files are read on launch.
    const pending = new File(directory, `${id}.pending`);
    pending.writeSync(json);
    pending.moveSync(destination);
  }

  return note;
}

export function asNote({ savedAt, ...note }: SavedNote): Note {
  const date = new Date(savedAt);
  return {
    ...note,
    date: date.toDateString() === new Date().toDateString()
      ? 'Today'
      : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date),
  };
}
