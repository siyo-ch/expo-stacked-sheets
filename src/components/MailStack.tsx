import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useDrafts } from '../navigation/draftStore';
import { useMotion } from '../navigation/sheetMotion';
import { colors } from '../theme';
import { ComposeBody } from '../screens/ComposeBody';
import { InboxBody } from '../screens/InboxBody';
import { StackedCard } from './StackedCard';

export function MailStack() {
  const drafts = useDrafts();

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
    flex: 1,
    backgroundColor: colors.backdrop,
    overflow: 'hidden',
  },
});
