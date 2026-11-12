# Expo Stacked Sheets

An Expo-compatible React Native component for opening, minimizing, and browsing
stacked sheets. Each open sheet has its own native-stack route. Closing a sheet
or using Android Back can remove a single route while the other sheets remain open.

## Install

This version targets Expo SDK 58 and React Native 0.88. Install the compatible
native dependencies in your app:

```sh
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated react-native-worklets
```

To install an archive built from this repository, pass its package name and
file path to Expo CLI:

```sh
npx expo install 'expo-stacked-sheets@file:/absolute/path/to/expo-stacked-sheets-0.1.0.tgz'
```

Once a release is available on your npm registry, use `npx expo install expo-stacked-sheets`.

## Usage

Mount the component in a full-screen area. Keep a `GestureHandlerRootView` and a
`SafeAreaProvider` above it. If the host app already provides them, reuse those
providers.

```tsx
import { StackedSheets } from 'expo-stacked-sheets';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function SheetsScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <StackedSheets
      initialSheets={[{ title: 'An open sheet', body: 'This starts minimized.' }]}
      renderBackground={({ active, openSheet }) => (
        <View style={{ padding: 24, paddingTop: top + 24 }}>
          <Pressable
            disabled={!active}
            onPress={() => openSheet({ title: 'A new sheet' })}
          >
            <Text>Open a sheet</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SheetsScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
```

- `initialSheets` supplies the sheets that start minimized. Each sheet accepts a
  title, body, and optional image with a source and accessibility label.
- `renderBackground` renders your screen and receives `openSheet`. Pass an
  optional `measureInWindow` rectangle to open a sheet from a pressed row.
- `renderPreview` and `renderEditor` replace the default note content.
- `onSaveSheet` adds a Save button to the editor. Commit the sheet in this
  synchronous callback and return `true` to close it. Returning `false` or
  throwing leaves the draft open. Give seeded `initialSheets` an optional `id`
  if your app needs to recognize the same draft after restarting.
  A custom editor receives the active sheet, `update`, and `ready`, which indicates
  when the opening transition has settled. The library supplies the minimize
  and close controls.
- `renderIcon`, `renderStatusBar`, and `emptyTitle` let you match the host app.

Sheet edits live for the lifetime of the mounted stack. The component owns an
independent native-stack navigator. When using it within a host navigator, mount
it on the active screen so the sheet navigator can handle Android Back.

From the repository root, run `npm pack --workspace expo-stacked-sheets` to
create an archive for testing. The Notes demo uses the workspace package directly.
