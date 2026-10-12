import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { progressOf } from '../logic';
import { colors, font } from '../theme';
import type { Card, CardStatus } from '../types';
import { Button, ProgressBar, Screen } from '../components/ui';

export function ResultScreen({
  deckName,
  deckCards,
  results,
  onReview,
  onRetryAll,
  onHome,
}: {
  deckName: string;
  /** 結果反映後のセット内の全カード */
  deckCards: Card[];
  results: Record<string, CardStatus>;
  onReview: () => void;
  onRetryAll: () => void;
  onHome: () => void;
}) {
  const answered = Object.values(results);
  const known = answered.filter((s) => s === 'known').length;
  const again = answered.filter((s) => s === 'again').length;
  const p = progressOf(deckCards);
  const mistakes = deckCards.filter((c) => c.status === 'again');
  const perfect = answered.length > 0 && again === 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.emoji}>{perfect ? '🎉' : '💪'}</Text>
        <Text style={styles.title}>{perfect ? 'ぜんぶ覚えた！' : 'おつかれさま！'}</Text>
        <Text style={styles.deck}>{deckName}</Text>

        <View style={styles.row}>
          <View style={[styles.box, { backgroundColor: colors.okSoft }]}>
            <Text style={[styles.num, { color: colors.ok }]}>{known}</Text>
            <Text style={styles.boxLabel}>覚えた</Text>
          </View>
          <View style={[styles.box, { backgroundColor: colors.warnSoft }]}>
            <Text style={[styles.num, { color: colors.warn }]}>{again}</Text>
            <Text style={styles.boxLabel}>もう一度</Text>
          </View>
        </View>

        <View style={styles.progress}>
          <Text style={styles.progressTitle}>このセット全体の進捗</Text>
          <Text style={styles.progressNum}>
            {p.known} / {p.total} 枚 覚えた（{p.percent}%）
          </Text>
          <ProgressBar percent={p.percent} color={colors.purple} />
        </View>

        {mistakes.length > 0 && (
          <View style={styles.progress}>
            <Text style={styles.progressTitle}>復習が必要なカード（{mistakes.length}枚）</Text>
            {mistakes.slice(0, 10).map((c) => (
              <Text key={c.id} style={styles.mistake}>
                ・{c.front} → {c.back}
              </Text>
            ))}
            {mistakes.length > 10 && <Text style={styles.mistake}>…ほか{mistakes.length - 10}枚</Text>}
          </View>
        )}

        <View style={{ gap: 10, marginTop: 8 }}>
          {mistakes.length > 0 && <Button label={`まちがえたカードを復習（${mistakes.length}枚）`} tone="warn" onPress={onReview} />}
          <Button label="全部をもう一度（シャッフル）" tone="primary" onPress={onRetryAll} />
          <Button label="ホームにもどる" tone="ghost" onPress={onHome} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingBottom: 48, gap: 14, alignItems: 'stretch' },
  emoji: { fontSize: 56, textAlign: 'center', marginTop: 16 },
  title: { fontSize: font.big, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  deck: { fontSize: font.body, color: colors.sub, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  box: { flex: 1, borderRadius: 18, padding: 18, alignItems: 'center' },
  num: { fontSize: 44, fontWeight: '800' },
  boxLabel: { fontSize: font.body, fontWeight: '700', color: colors.ink },
  progress: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 8 },
  progressTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  progressNum: { fontSize: font.body, color: colors.sub },
  mistake: { fontSize: font.body, color: colors.ink, lineHeight: 26 },
});
