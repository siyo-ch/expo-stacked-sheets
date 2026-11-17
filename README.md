# Expo Stacked Sheets

Minimize drafts and reopen them from an Apple Mail–style stack in your Expo app.

## Demo

<!-- github-demo:start -->

https://github.com/user-attachments/assets/261228f0-c8bd-4038-9ed0-a47d9804354e

<!-- github-demo:end -->

[demo-cover]: https://raw.githubusercontent.com/siyo-ch/expo-stacked-sheets/main/assets/demo/notes-demo-cover.jpg
[demo-video]: https://cdn.jsdelivr.net/gh/siyo-ch/expo-stacked-sheets@main/assets/demo/notes-demo.mp4

## Install

Requires Expo SDK 58 and React Native 0.88.

```sh
npx expo install expo-stacked-sheets
```

On Expo 58.0.22, use
`npx expo install expo-stacked-sheets 'react-native-safe-area-context@~5.10.1'`.

## Usage

Add this to `App.tsx` or a full-screen Expo Router route.

```tsx
import { StackedSheets } from 'expo-stacked-sheets';
import { Button } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StackedSheets
          initialSheets={[
            { title: 'Weekend plans', body: 'Pick a place for breakfast.' },
            { title: 'Reading list', body: 'Finish the last chapter.' },
          ]}
          renderBackground={({ active, openSheet }) => (
            <SafeAreaView>
              <Button title="New draft" disabled={!active} onPress={() => openSheet()} />
            </SafeAreaView>
          )}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

Tap the bar at the bottom to see both drafts. The down arrow minimizes a draft.

Drafts stay in memory. To enable Save, pass a synchronous `onSaveSheet` callback
that returns `true` when the save succeeds.
[Component props](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/packages/stacked-sheets/src/types.ts)

## Run the Notes demo

From a [repository checkout](https://github.com/siyo-ch/expo-stacked-sheets), run
`npm ci && npm start`. Press `i` for iOS or `a` for Android.
[Photo credits](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/assets/notes/CREDITS.md)

[MIT](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/LICENSE)
