# Contributing

Thanks for helping with Expo Stacked Sheets.

## Questions and ideas

Use [Discussions](https://github.com/siyo-ch/expo-stacked-sheets/discussions) for
questions, ideas and things you built. Use issues for bugs and concrete feature requests.

## Setup

The repository is the Notes demo app. The library lives in `packages/stacked-sheets`
and is linked as an npm workspace.

```sh
npm ci
npm start      # press i for iOS or a for Android
```

## Before opening a pull request

```sh
npm test
npm run typecheck
npm run lint
```

- Keep changes focused. One pull request should fix one bug or add one feature.
- Test gestures and animations on both iOS and Android when you change them.
  Include a short screen recording for visual changes.
- Check light and dark appearance for UI changes.
- Avoid adding dependencies to the library.

## Where to look

| File | What it does |
| --- | --- |
| `packages/stacked-sheets/src/StackedSheets.tsx` | Public component and navigation stack |
| `packages/stacked-sheets/src/sheetMotion.tsx` | Sheet state, controller and shared values |
| `packages/stacked-sheets/src/sheetLayout.ts` | Geometry, 3D transforms and gesture thresholds |
| `packages/stacked-sheets/src/SheetStage.tsx` | Background page, bottom bar and overview |
| `packages/stacked-sheets/src/SheetEditor.tsx` | Full-screen sheet and drag to minimize |
| `packages/stacked-sheets/src/StackedCard.tsx` | Cards in the 3D overview |
| `packages/stacked-sheets/src/sheetTheme.tsx` | Light and dark colors |

Layout math is covered by `src/navigation/sheetLayout.test.ts`. Add a test when you
change thresholds or transforms.
