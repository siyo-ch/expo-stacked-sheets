import { Ionicons } from '@react-native-vector-icons/ionicons';
import { BaseNavigationContainer, DarkTheme, DefaultTheme, StackActions, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StackedSheets, type InitialSheet, type Sheet, type SheetBackgroundProps, type SheetIcon } from 'expo-stacked-sheets';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View, useColorScheme } from 'react-native';

import { NOTES, type Note } from '../data/notes';
import { asNote, loadSavedNotes, saveDraftAsNote } from '../data/savedNotes';
import { InboxBody } from '../screens/InboxBody';
import { NoteDetail } from '../screens/NoteDetail';

type NotesParamList = { Notes: undefined; Note: { noteId: string } };
const Stack = createNativeStackNavigator<NotesParamList>();

const initialDrafts: readonly InitialSheet[] = [
  {
    id: 'draft-gifts',
    title: 'Breakfast Notes',
    body: 'A slow breakfast and a little time to make plans for the day.',
    image: {
      source: require('../../assets/notes/draft-breakfast.jpg'),
      label: 'Breakfast',
    },
  },
  {
    id: 'draft-repairs',
    title: 'Around the Block',
    body: 'Took the long way home. A few familiar corners, and something new to notice along the way.',
    image: {
      source: require('../../assets/notes/draft-street.jpg'),
      label: 'A neighborhood street',
    },
  },
  {
    id: 'draft-packing',
    title: 'By the Sea',
    body: 'No plans for the afternoon. Just a walk by the water and the sound of the waves.',
    image: {
      source: require('../../assets/notes/draft-sea.jpg'),
      label: 'The sea',
    },
  },
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
      renderStatusBar={(mode, colorScheme) => (
        <StatusBar style={colorScheme === 'dark' || mode === 'overview' ? 'light' : 'dark'} animated />
      )}
      renderIcon={(name, size, color) => <Ionicons name={icons[name]} size={size} color={color} />}
      emptyTitle="New Draft"
    />
  );
}

function NotesPages({ active, openSheet, notes, navigation }: SheetBackgroundProps & {
  notes: readonly Note[];
  navigation: ReturnType<typeof useNavigationContainerRef<NotesParamList>>;
}) {
  const isDark = useColorScheme() === 'dark';
  const surface = isDark ? '#141416' : '#FFF';
  const ink = isDark ? '#F5F5F7' : '#111';
  const divider = isDark ? '#2C2C2E' : '#E8E8E8';
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: surface,
      card: surface,
      text: ink,
      border: divider,
    },
  };

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
    <BaseNavigationContainer ref={navigation} theme={navTheme}>
      <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: surface } }}>
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
          options={{
            title: '',
            headerBackTitle: 'Notes',
            headerTintColor: ink,
            headerStyle: { backgroundColor: surface },
            gestureEnabled: active,
            headerShadowVisible: Platform.OS === 'android' ? false : undefined,
          }}
        >
          {({ route }) => (
            <>
              {Platform.OS === 'android' && <View style={[styles.noteDivider, { backgroundColor: divider }]} />}
              <NoteDetail note={notes.find((note) => note.id === route.params.noteId)} />
            </>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </BaseNavigationContainer>
  );
}

const styles = StyleSheet.create({
  noteDivider: {
    backgroundColor: '#E8E8E8',
    height: StyleSheet.hairlineWidth,
  },
});
