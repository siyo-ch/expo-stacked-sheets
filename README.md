# Stacked mail drafts

An Expo app that shows several compose drafts as stacked cards over an inbox, the same way iOS Mail does. Sample messages only. No mail server.

## Run

Node.js 22.13 or newer.

```bash
npm install
npx expo start
```

- `i` opens the iOS simulator
- `a` opens the Android emulator
- Scan the QR code with Expo Go for SDK 58

```bash
npx expo start --web
```

## Stacked drafts

The inbox is the back card. The blue button at the bottom right opens a 新邮件 card. Tap it again on the front card to open another. Each new card slides up. Cards behind it scale down and shift up, so their top edges stay visible. Only the front card takes input.

Each draft keeps its own recipient, subject, and body. The from address is `navigatoricsl@gmail.com`. The signature is 发自我的 iPhone.

Close the front card with the X, or drag its title downward. On Android, the system back button does the same thing: it removes only the top draft.

## Layout

- `App.tsx` starts the app
- `src/screens/InboxBody.tsx` is the inbox
- `src/screens/ComposeBody.tsx` is one compose draft
- `src/components/StackedCard.tsx` draws each card
- `src/navigation/sheetLayout.ts` places the stack
- `src/navigation/RootNavigator.tsx` keeps one screen per draft
- `src/data/mails.ts` is the sample inbox
