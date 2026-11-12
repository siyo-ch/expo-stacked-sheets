# Expo Stacked Sheets

Stacked Sheets is an Expo component for editing multiple drafts, inspired by
the iOS Mail draft switcher. Minimize a draft to keep using the current screen,
then resume it from the card overview.

## Install in your Expo app

Version 1.0.0 targets **Expo SDK 58** and **React Native 0.88**. The command below
will work once the first npm release is live. Until then, you can
[install from a local archive](packages/stacked-sheets/README.md#demo-and-local-archives).

```sh
npx expo install expo-stacked-sheets
```

## Quick start

Mount `StackedSheets` under `GestureHandlerRootView` and `SafeAreaProvider`.
Render your screen with `renderBackground` and call `openSheet()` to open a draft.
See the [complete example](packages/stacked-sheets/README.md#quick-start) and
[SDK-specific install notes](packages/stacked-sheets/README.md#install).

## Run the Notes demo

The demo opens with sample notes and three minimized drafts. Use Node.js
26.13.0 from `.nvmrc` (`nvm use` if you use nvm).

```bash
npm ci
npm start
```

- `i` opens the iOS simulator.
- `a` opens the Android emulator.
- Scan the QR code with Expo Go for SDK 58.
- `npm run web` opens the web preview.

### Try the draft workflow

1. Tap `+` to start a draft. Tap a note row to read an existing note.
2. Drag the editor header down or tap its down arrow to minimize the note.
   A short or cancelled drag springs back. The list stays usable beneath the editor.
3. Tap the bottom bar to resume a single note or view all open notes. Long-pressing
   the bar opens the overview even when there is only one note.
4. Scroll vertically to browse the overview. Tap a card to open it, swipe it
   sideways to close it, or tap the exposed background to return. On iOS you can
   also close a card by tapping its X.

## Project layout

- `packages/stacked-sheets/` contains the npm package, including its public API,
  gestures, native stack, and draft state.
- `src/` and `assets/` contain the Notes demo and its sample data. The sample
  photos have separate licenses listed in the [photo credits](assets/notes/CREDITS.md).

The demo imports the npm workspace directly. To check the files that ship in the
package, run `npm pack --workspace expo-stacked-sheets --dry-run`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

Tests cover card layout, gesture thresholds, draft state, and native-stack router
history.

## License

[MIT](LICENSE)
