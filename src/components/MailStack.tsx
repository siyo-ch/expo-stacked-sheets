import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useDrafts } from '../navigation/draftStore';
import { presentDraftCount, useMotion } from '../navigation/sheetMotion';
import { colors } from '../theme';
import { ComposeBody } from '../screens/ComposeBody';
import { InboxBody } from '../screens/InboxBody';
import { StackedCard } from './StackedCard';

export function MailStack() {
  const drafts = useDrafts();
  const committed = useRef(drafts.length);

  // After the new card's animated style is attached, so the sheet starts
  // offscreen and rises instead of snapping to its rest position.
  useEffect(() => {
    if (drafts.length > committed.current) {
      presentDraftCount(drafts.length);
    }
    committed.current = drafts.length;
  }, [drafts.length]);

  return (
    <View style={styles.root}>
      <StackStatusBar />
      <StackedCard index={0}>
        <InboxBody />
      </StackedCard>
      {drafts.map((draft, index) => (
        <StackedCard key={draft.id} index={index + 1}>
          <ComposeBody draft={draft} />
        </StackedCard>
      ))}
    </View>
  );
}

function StackStatusBar() {
  const { presented, drag } = useMotion();
  const [lightIcons, setLightIcons] = useState(false);

  useAnimatedReaction(
    () => presented.value - drag.value > 0.12,
    (next, previous) => {
      if (next !== previous) {
        runOnJS(setLightIcons)(next);
      }
    },
  );

  return <StatusBar style={lightIcons ? 'light' : 'dark'} animated />;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.backdrop,
  },
});
