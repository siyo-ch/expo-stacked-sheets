# Expo Stacked Sheets

Minimize drafts and reopen them from an Apple Mail–style stack in your Expo app. Works on iOS and Android.

<!-- github-demo:start -->

https://github.com/user-attachments/assets/261228f0-c8bd-4038-9ed0-a47d9804354e

<!-- github-demo:end -->

[demo-cover]: https://raw.githubusercontent.com/siyo-ch/expo-stacked-sheets/main/assets/demo/notes-demo-cover.jpg
[demo-video]: https://cdn.jsdelivr.net/gh/siyo-ch/expo-stacked-sheets@main/assets/demo/notes-demo.mp4

If this saves you some work, a ⭐ helps other people find it.

## When to use it

Use it when people work on more than one thing at a time: emails, notes, posts, or forms they want to set aside and pick up later. Each draft minimizes into a bar at the bottom, and tapping the bar fans the drafts out so any one can be reopened.

If your app only ever shows one sheet at a time, a regular sheet such as React Navigation's `formSheet` is simpler.

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
