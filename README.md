# Expo Stacked Sheets

Open multiple drafts, minimize them to keep using the current screen, and resume
any draft from a card overview. Stacked Sheets is a React Native component
inspired by the iOS Mail draft switcher.

See the [package README](packages/stacked-sheets/README.md) for installation,
compatibility, and a minimal example for Expo SDK 58.

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

To inspect performance without development-mode JavaScript overhead:

```bash
npx expo start --no-dev --minify
```

## Try the draft workflow

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
