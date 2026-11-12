# Expo Stacked Sheets

Open multiple drafts, minimize them to keep using the current screen, and resume
any draft from a card overview. Each draft has its own native-stack route so
Android Back can close the active draft while keeping the others open.

## Compatibility

| Dependency | Version |
| --- | --- |
| Expo SDK | 58 |
| React Native | 0.88.x |
| React | 19.3.x |
| Reanimated / Worklets | 4.7.1 / 0.13.0 |
| Safe Area Context | `~5.10.1` or `~5.11.1`, depending on the Expo SDK patch |

Use an Expo Go client that matches SDK 58 or an Expo development build with the
native dependencies installed. For a development build, rebuild after adding or
changing a native dependency.

## Install

With npm, install Stacked Sheets. npm installs any missing peer dependencies.

```sh
npx expo install expo-stacked-sheets
```

If your SDK patch uses Safe Area Context 5.10.x (for example, Expo 58.0.22)
and your app does not already have it, pin that version in the install command.

```sh
npx expo install expo-stacked-sheets 'react-native-safe-area-context@~5.10.1'
```

## Quick start

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

Open a second sheet after minimizing the first. Tap the bottom bar to view the
open drafts and select one to resume editing.

## Props

- `initialSheets` supplies the sheets that start minimized. Each sheet accepts a
  title, body, and optional image with a source and accessibility label.
- `renderBackground` renders your screen and receives `openSheet`. Pass an
  optional `measureInWindow` rectangle to open a sheet from a pressed row.
- `renderPreview` and `renderEditor` replace the default note content.
- `onSaveSheet` adds a Save button to the editor. Commit the sheet in this
  synchronous callback and return `true` to close it. Returning `false` or
  throwing leaves the draft open. Give seeded `initialSheets` an optional `id`
  if your app needs to identify it across launches.
- `renderIcon`, `renderStatusBar`, and `emptyTitle` let you match the host app.

A custom editor receives the active sheet, `update`, and `ready` (whether the
opening transition has settled). The library supplies the minimize and close
controls.

## State and navigation

Sheet edits live for the lifetime of the mounted stack. Save data in the host
app if it needs to survive a restart. The component owns an independent
native-stack navigator. When using it within a host navigator, mount it on the
active screen so the sheet navigator can handle Android Back.

## Demo and local archives

Run the Notes demo from the [repository](https://github.com/Fizzbow/expo-stacked-sheets#run-the-notes-demo).
To try an unpublished revision, run `npm pack --workspace expo-stacked-sheets` at
the repository root. Then install the resulting archive in your Expo app.

```sh
npx expo install 'expo-stacked-sheets@file:/absolute/path/to/expo-stacked-sheets-1.0.0.tgz'
```

## License

[MIT](https://github.com/Fizzbow/expo-stacked-sheets/blob/main/LICENSE)
