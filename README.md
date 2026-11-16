# Expo Stacked Sheets

Edit multiple drafts in an Expo app. Minimize them to keep using the current
screen, then reopen any draft from an iOS Mail-style card overview.

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

If your SDK patch uses Safe Area Context 5.10.x (such as Expo 58.0.22), include
`'react-native-safe-area-context@~5.10.1'` in the install command.

## Usage

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

Reuse the providers if your app already has them. Drafts stay in memory.
Use `onSaveSheet` to save them in your app.
[Component props](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/packages/stacked-sheets/src/types.ts)

## Run the Notes demo

From a [repository checkout](https://github.com/siyo-ch/expo-stacked-sheets), run
`npm ci && npm start`. Press `i` for iOS or `a` for Android.
[Photo credits](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/assets/notes/CREDITS.md)

For an unpublished build, run `npm pack --workspace expo-stacked-sheets` and
install the resulting `.tgz` in your Expo app.

[MIT](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/LICENSE)
