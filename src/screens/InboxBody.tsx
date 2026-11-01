import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRef, useState, type ComponentRef } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

import { ComposeFab } from '../components/ComposeFab';
import { MAILS, type Mail } from '../data/mails';
import { useDrafts } from '../navigation/draftStore';
import { sheetFrame } from '../navigation/sheetLayout';
import { openCompose, useMotion } from '../navigation/sheetMotion';
import { colors } from '../theme';

export function InboxBody() {
  const drafts = useDrafts();
  const front = drafts.length === 0;
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { presented, drag } = useMotion();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const headerStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, presented.value - drag.value);
    const frame = sheetFrame({
      presented: progress,
      index: 0,
      height,
      topInset: insets.top,
    });
    const tucked = Math.max(insets.top, 1);
    return {
      paddingTop: interpolate(
        frame.top,
        [0, tucked],
        [insets.top, 8],
        Extrapolation.CLAMP,
      ),
    };
  }, [drag, height, insets.top, presented]);

  const toggleSelecting = () => {
    setSelecting((value) => !value);
    setSelected([]);
  };

  const toggleRow = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const openMenu = () => {
    Alert.alert('所有收件箱', undefined, [
      { text: '新邮件', onPress: openCompose },
      { text: '全部标为已读' },
      { text: '取消', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="回到顶部"
          hitSlop={8}
          style={styles.back}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </Pressable>
        <View pointerEvents="none" style={styles.titleBlock}>
          <Text style={styles.title}>所有收件箱</Text>
          <Text style={styles.subtitle}>所有邮件 · 正在连接...</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={selecting ? '取消选择' : '选择'}
            onPress={toggleSelecting}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          >
            <Text style={[styles.pillText, selecting && styles.pillActive]}>
              {selecting ? '取消' : '选择'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="更多"
            onPress={openMenu}
            style={({ pressed }) => [styles.more, pressed && styles.pressed]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </Pressable>
        </View>
      </Animated.View>
      <ScrollView
        ref={scrollRef}
        scrollEnabled={front}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      >
        {MAILS.map((mail, index) => (
          <MailRow
            key={mail.id}
            mail={mail}
            last={index === MAILS.length - 1}
            selecting={selecting}
            selected={selected.includes(mail.id)}
            onPress={() => {
              if (selecting) toggleRow(mail.id);
            }}
          />
        ))}
      </ScrollView>
      {front ? <ComposeFab /> : null}
    </View>
  );
}

function MailRow({
  mail,
  last,
  selecting,
  selected,
  onPress,
}: {
  mail: Mail;
  last: boolean;
  selecting: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && selecting && styles.rowPressed]}
    >
      {selecting ? (
        <View style={[styles.check, selected && styles.checkOn]}>
          {selected ? (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          ) : null}
        </View>
      ) : null}
      <View style={[styles.avatar, { backgroundColor: mail.tint }]}>
        {mail.icon === 'star' ? (
          <Ionicons name="star" size={20} color={colors.white} />
        ) : (
          <Text style={styles.letter}>{mail.sender.slice(0, 1).toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.topLine}>
          <Text
            numberOfLines={1}
            style={[styles.sender, mail.unread && styles.senderUnread]}
          >
            {mail.sender}
          </Text>
          <View style={styles.timeWrap}>
            <Text style={styles.time}>{mail.time}</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.chevron} />
          </View>
        </View>
        <Text numberOfLines={1} style={styles.subject}>
          {mail.subject}
        </Text>
        <Text numberOfLines={2} style={styles.preview}>
          {mail.preview}
        </Text>
        {last ? null : <View style={styles.separator} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.card,
  },
  header: {
    minHeight: 52,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  back: {
    position: 'absolute',
    left: 6,
    bottom: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    paddingHorizontal: 108,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 1,
    fontSize: 12,
    color: colors.secondary,
  },
  actions: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: colors.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 16,
    color: colors.text,
  },
  pillActive: {
    color: colors.blue,
  },
  more: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 16,
    paddingRight: 12,
    paddingTop: 12,
  },
  rowPressed: {
    backgroundColor: colors.pressed,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    marginRight: 10,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 12,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sender: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
  },
  senderUnread: {
    fontWeight: '700',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  time: {
    fontSize: 15,
    color: colors.secondary,
  },
  subject: {
    marginTop: 2,
    fontSize: 15,
    color: '#3A3A3C',
  },
  preview: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 20,
    color: colors.secondary,
  },
  separator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
});
