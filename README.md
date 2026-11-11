# Stacked notes

An Expo prototype of stacked note editing, inspired by the iOS Mail draft
switcher. It opens to six sample notes and three minimized sheets. Edits survive
switching and minimizing within the current app session and reset on restart.
The sample photos have separate licenses listed in the [photo credits](assets/notes/CREDITS.md).

## Run

Use Node.js 22.13+, 24.3+, or 26+ in the corresponding supported major version.
The project defaults to Node.js 26.13.0 LTS via `.nvmrc` (`nvm use` if using nvm).
Node.js 25 is unsupported by SDK 58. Install dependencies before running
`npx expo`: without the local CLI, npm on Node.js 25 can select Expo 57 instead.

```bash
npm install
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

## Notes workflow

1. Tap a row to open a sample note, or tap `+` to start an empty note.
2. Drag the editor header down or tap its down arrow to minimize the note.
   A short or cancelled drag springs back. The list stays usable beneath the editor.
3. Tap the bottom bar to resume a single note or view all open notes. Long-pressing
   the bar opens the overview even when there is only one note.
4. Scroll vertically to browse the overview. Tap a card to open it, swipe it
   sideways to close it, or tap the exposed background to return. On iOS you can
   also close a card by tapping its X.

Each open note has its own `Compose` route in the native stack. Selecting a card
brings its route forward without discarding the other routes.

## Implementation

- `src/navigation/RootNavigator.tsx` owns native navigation history.
- `src/navigation/sheetMotion.tsx` coordinates inbox, editor and overview modes.
- `src/navigation/sheetLayout.ts` contains shared projection and gesture decisions.
- `src/navigation/draftStore.ts` exposes stable draft-ID snapshots and per-draft
  subscriptions, so typing does not rerender the entire deck.
- `src/components/MailStack.tsx` provides the inbox stage, draft bar and scrolling.
- `src/components/StackedCard.tsx` renders lightweight, non-editable previews.
- `src/screens/ComposeBody.tsx` reuses one pre-mounted editor across drafts.

Overview movement runs through Reanimated shared values on the UI thread. Card
layout and gradient bounds remain fixed while transforms and opacity animate.
Drag completion uses velocity-aware springs; vertical browsing has inertia and
edge resistance. Perspective is confined to the overview, with opaque paper and
continuous shading. The source reference is the supplied 43-second iOS Mail
recording: the flat editor around 5s, bottom draft bar around 19s, and overview
around 20–22s and 36–43s.

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

Tests cover overview reachability on short and tall screens, gesture cancellation
and flick thresholds, stable subscriptions while typing, arbitrary draft removal,
and the actual navigation router's select/back behavior. Native gesture behavior
and keyboard transitions also require device validation; web testing alone does
not establish native smoothness.
