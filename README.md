# Stacked mail drafts

An Expo prototype of Mail's draft workflow: a flat editor, a bottom draft bar,
and a scrollable card overview. Sample messages only; it does not connect to a
mail server or send messages. Drafts survive switching and minimizing within the
current app session, but are not saved across app restarts.
On launch, one empty draft is already minimized below the inbox to match the
reference. Its white capsule sits at the bottom of the screen, separated from
the rounded inbox by a black gap. Tap it to resume, or close it in the editor.

## Run

Use Node.js 22.13+, 24.3+, or 26+ in the corresponding supported major version.

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

## Draft workflow

1. Tap the compose icon in the inbox to open a full, flat editor. The recipient
   field receives focus and the keyboard opens. The editor has a large title,
   a drag handle, close/minimize controls and recipient, subject and body fields.
2. Drag the header down or tap its down arrow to minimize. A short or cancelled
   drag springs back. Minimizing preserves all fields and leaves a “新邮件” bar
   below the inbox, which remains scrollable and usable.
3. Tap the bar to resume a single draft. With multiple drafts it opens the
   overview; long-pressing the bar also opens the overview with one draft.
4. In the overview, scroll vertically to reach drafts. Tap any visible card to
   edit it, swipe it sideways to close it, or use that card's X. Other cards
   settle into the vacant position. Tap the exposed background to return.
5. The inbox compose icon can create another independent draft while previous
   drafts are minimized. Closing removes that draft; minimizing keeps it.

Each new draft pushes a separate `Compose` screen in the native stack. Selecting
an existing draft brings its route forward without discarding the other routes.
Android back pops only the top route. The from address is
`navigatoricsl@gmail.com`, and the signature is `发自我的 iPhone`.

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
