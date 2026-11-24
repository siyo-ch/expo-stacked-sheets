# Expo Stacked Sheets

Apple Mail–style 3D stacked sheets for Expo and React Native. Works on iOS and Android.

[![npm](https://img.shields.io/npm/v/expo-stacked-sheets)](https://www.npmjs.com/package/expo-stacked-sheets)
[![license](https://img.shields.io/npm/l/expo-stacked-sheets)](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/LICENSE)

## Demo

<!-- github-demo:start -->

https://github.com/user-attachments/assets/261228f0-c8bd-4038-9ed0-a47d9804354e

<!-- github-demo:end -->

[Try the two-sheet example on your phone with Expo Go (SDK 58).](https://snack.expo.dev/qGk1n9NXS3PwXTsShAxbf?platform=mydevice)

[demo-cover]: https://raw.githubusercontent.com/siyo-ch/expo-stacked-sheets/main/assets/demo/notes-demo-cover.jpg
[demo-video]: https://cdn.jsdelivr.net/gh/siyo-ch/expo-stacked-sheets@main/assets/demo/notes-demo.mp4

## Install

Run this in your Expo SDK 58 app. Expo selects the matching native dependencies.

```sh
npx expo-stacked-sheets@latest install
```

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
              <Button title="New sheet" disabled={!active} onPress={() => openSheet()} />
            </SafeAreaView>
          )}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

Tap the bar at the bottom to see both sheets. The down arrow minimizes a sheet.

Sheets follow the system appearance. Pass `colorScheme="light"` or `colorScheme="dark"`
to force one.

Sheets stay in memory. To enable Save, pass a synchronous `onSaveSheet` callback
that returns `true` when the save succeeds.
[Component props](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/packages/stacked-sheets/src/types.ts)

## Run the Notes demo

From a [repository checkout](https://github.com/siyo-ch/expo-stacked-sheets), run
`npm ci && npm start`. Press `i` for iOS or `a` for Android.
[Photo credits](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/assets/notes/CREDITS.md)

[MIT](https://github.com/siyo-ch/expo-stacked-sheets/blob/main/LICENSE)
