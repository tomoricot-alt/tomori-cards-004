import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { shuffle } from '../logic';
import { colors, font } from '../theme';
import type { Card, CardStatus } from '../types';
import { Button, ProgressBar, Screen } from '../components/ui';
import { FlipCard } from '../components/FlipCard';

export function StudyScreen({
  deckName,
  cards,
  review,
  onMark,
  onFinish,
  onQuit,
}: {
  deckName: string;
  /** 学習開始時に決まったカードの並び */
  cards: Card[];
  review: boolean;
  onMark: (cardId: string, status: CardStatus) => void;
  onFinish: (results: Record<string, CardStatus>) => void;
  onQuit: () => void;
}) {
  const [queue, setQueue] = useState<Card[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, CardStatus>>({});

  const card = queue[index];
  if (!card) {
    return (
      <Screen>
        <View style={{ padding: 18, gap: 12 }}>
          <Text style={styles.title}>学習するカードがありません</Text>
          <Button label="ホームにもどる" onPress={onQuit} />
        </View>
      </Screen>
    );
  }

  const mark = (status: CardStatus) => {
    const next = { ...results, [card.id]: status };
    setResults(next);
    onMark(card.id, status);
    if (index + 1 >= queue.length) return onFinish(next);
    setIndex(index + 1);
    setFlipped(false);
  };

  const doShuffle = () => {
    setQueue([...queue.slice(0, index), ...shuffle(queue.slice(index))]);
    setFlipped(false);
  };

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="学習をやめる" onPress={onQuit} style={styles.quit}>
            <Text style={styles.quitText}>✕ やめる</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="残りのカードをシャッフル" onPress={doShuffle} style={styles.quit}>
            <Text style={[styles.quitText, { color: colors.purple }]}>🔀 シャッフル</Text>
          </Pressable>
        </View>
        <Text style={styles.deck}>
          {deckName}
          {review ? '（まちがい復習）' : ''}
        </Text>
        <Text style={styles.count} accessibilityLabel={`${queue.length}枚中${index + 1}枚目`}>
          {index + 1} / {queue.length}
        </Text>
        <ProgressBar percent={Math.round((index / queue.length) * 100)} color={colors.purple} />

        <View style={{ marginTop: 20 }}>
          <FlipCard key={card.id} front={card.front} back={card.back} flipped={flipped} onToggle={() => setFlipped((f) => !f)} />
        </View>

        <View style={styles.actions}>
          {flipped ? (
            <>
              <Button label="もう一度" tone="warn" style={{ flex: 1 }} onPress={() => mark('again')} />
              <Button label="覚えた！" tone="ok" style={{ flex: 1 }} onPress={() => mark('known')} />
            </>
          ) : (
            <Button label="答えを見る" style={{ flex: 1 }} onPress={() => setFlipped(true)} />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingBottom: 32 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  quit: { minHeight: 44, justifyContent: 'center' },
  quitText: { fontSize: font.body, fontWeight: '800', color: colors.sub },
  deck: { fontSize: 20, fontWeight: '800', color: colors.ink },
  count: { fontSize: font.small, color: colors.sub, marginVertical: 6, fontWeight: '700' },
  title: { fontSize: font.title, fontWeight: '800', color: colors.ink },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
});
