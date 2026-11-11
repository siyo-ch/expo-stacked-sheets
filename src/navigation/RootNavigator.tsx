import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StatusBar } from 'expo-status-bar';
import { StackedSheets, type SheetContent, type SheetIcon } from 'expo-stacked-sheets';

import { notePhotos } from '../data/notePhotos';
import { NOTES } from '../data/notes';
import { InboxBody } from '../screens/InboxBody';

const initialSheets: readonly SheetContent[] = NOTES.slice(0, 3).map((note) => ({
  title: note.title,
  body: note.body,
  image: notePhotos[note.id],
}));

const icons = {
  close: 'close',
  sheet: 'document-text-outline',
  expand: 'chevron-up',
  minimize: 'chevron-down',
} as const satisfies Record<SheetIcon, string>;

export function RootNavigator() {
  return (
    <StackedSheets
      initialSheets={initialSheets}
      renderBackground={(props) => <InboxBody {...props} />}
      renderStatusBar={(mode) => <StatusBar style={mode === 'overview' ? 'light' : 'dark'} animated />}
      renderIcon={(name, size) => <Ionicons name={icons[name]} size={size} color="#111" />}
      emptyTitle="New Note"
    />
  );
}
