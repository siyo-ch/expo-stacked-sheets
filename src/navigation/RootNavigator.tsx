import { Ionicons } from '@react-native-vector-icons/ionicons';
import { BaseNavigationContainer, DefaultTheme, StackActions, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StackedSheets, type InitialSheet, type Sheet, type SheetBackgroundProps, type SheetIcon } from 'expo-stacked-sheets';
import { useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';

import { NOTES, type Note } from '../data/notes';
import { asNote, loadSavedNotes, saveDraftAsNote } from '../data/savedNotes';
import { InboxBody } from '../screens/InboxBody';
import { NoteDetail } from '../screens/NoteDetail';

type NotesParamList = { Notes: undefined; Note: { noteId: string } };
const Stack = createNativeStackNavigator<NotesParamList>();

const initialDrafts: readonly InitialSheet[] = [
  { id: 'draft-gifts', title: 'Gift Ideas', body: 'A small ceramic vase, a used novel, or tickets to a matinee.' },
  { id: 'draft-repairs', title: 'Things to Fix', body: 'Tighten the desk lamp and replace the batteries in the kitchen clock.' },
  { id: 'draft-packing', title: 'Packing List', body: 'Charger\nLight jacket\nNotebook\nWater bottle' },
];

const icons = {
  close: 'close',
  sheet: 'document-text-outline',
  expand: 'chevron-up',
  minimize: 'chevron-down',
} as const satisfies Record<SheetIcon, string>;

export function RootNavigator() {
  const [savedNotes, setSavedNotes] = useState(loadSavedNotes);
  const notes = [...savedNotes.map(asNote), ...NOTES];
  const navigation = useNavigationContainerRef<NotesParamList>();

  const saveSheet = (sheet: Sheet) => {
    const sampleId = initialDrafts.find((draft) => draft.id === sheet.id)?.id;
    const note = saveDraftAsNote(sheet, sampleId);
    setSavedNotes((current) => [note, ...current]);
    if (navigation.isReady() && navigation.getCurrentRoute()?.name === 'Note') {
      navigation.dispatch(StackActions.popTo('Notes'));
    }
    return true;
  };

  return (
    <StackedSheets
      initialSheets={initialDrafts.filter((draft) => !savedNotes.some((note) => note.id === draft.id))}
      renderBackground={(props) => <NotesPages {...props} notes={notes} navigation={navigation} />}
      onSaveSheet={saveSheet}
      renderStatusBar={(mode) => <StatusBar style={mode === 'overview' ? 'light' : 'dark'} animated />}
      renderIcon={(name, size) => <Ionicons name={icons[name]} size={size} color="#111" />}
      emptyTitle="New Draft"
    />
  );
}

function NotesPages({ active, openSheet, notes, navigation }: SheetBackgroundProps & {
  notes: readonly Note[];
  navigation: ReturnType<typeof useNavigationContainerRef<NotesParamList>>;
}) {
  useEffect(() => {
    if (Platform.OS !== 'android' || !active) return;

    // Let the draft stack handle Back while its editor or overview is in front.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.canGoBack()) return false;
      navigation.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [active, navigation]);

  return (
    <BaseNavigationContainer ref={navigation} theme={DefaultTheme}>
      <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: '#FFF' } }}>
        <Stack.Screen name="Notes" options={{ headerShown: false }}>
          {({ navigation }) => (
            <InboxBody
              active={active}
              notes={notes}
              onNewDraft={() => openSheet()}
              onOpenNote={(noteId) => navigation.navigate('Note', { noteId })}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Note"
          options={{ title: '', headerBackTitle: 'Notes', headerTintColor: '#111', gestureEnabled: active }}
        >
          {({ route }) => <NoteDetail note={notes.find((note) => note.id === route.params.noteId)} />}
        </Stack.Screen>
      </Stack.Navigator>
    </BaseNavigationContainer>
  );
}
