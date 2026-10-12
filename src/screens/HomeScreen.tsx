import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LIMITS, SUBJECTS, cardsOfDeck, progressOf } from '../logic';
import { colors, font, subjectColor } from '../theme';
import type { AppData } from '../types';
import { Button, ProgressBar, Screen } from '../components/ui';

export function HomeScreen({
  data,
  corrupted,
  saveFailed,
  onCreateDeck,
  onOpenDeck,
  onStudy,
}: {
  data: AppData;
  corrupted: boolean;
  saveFailed: boolean;
  onCreateDeck: (name: string, subject: string) => string | null;
  onOpenDeck: (deckId: string) => void;
  onStudy: (deckId: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const err = onCreateDeck(name, subject);
    if (err) return setError(err);
    setName('');
    setError(null);
    setCreating(false);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.brand}>TOMORI CARDS</Text>
        <Text style={styles.title}>カードセット</Text>

        <View style={styles.notice} accessibilityRole="alert">
          <Text style={styles.noticeText}>
            📌 データはこの端末のブラウザ（アプリ）の中だけに保存されます。ブラウザの閲覧データを削除したり、別の端末・別のブラウザで開くと、カードは消えたり見られなくなったりします。名前やメールアドレスなどは入力しないでください。
          </Text>
        </View>
        {corrupted && (
          <View style={[styles.notice, styles.noticeWarn]} accessibilityRole="alert">
            <Text style={styles.noticeText}>⚠️ 保存されていたデータを読み込めなかったため、空の状態から始めます。</Text>
          </View>
        )}
        {saveFailed && (
          <View style={[styles.notice, styles.noticeWarn]} accessibilityRole="alert">
            <Text style={styles.noticeText}>⚠️ 保存に失敗しました。プライベートモードや容量不足の可能性があります。この画面を閉じると内容が消えるかもしれません。</Text>
          </View>
        )}

        {data.decks.length === 0 && !creating && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>まだカードセットがありません</Text>
            <Text style={styles.emptyText}>「英単語」「歴史年号」など、覚えたいことごとにセットを作ろう。</Text>
          </View>
        )}

        {data.decks.map((deck) => {
          const cards = cardsOfDeck(data, deck.id);
          const p = progressOf(cards);
          const color = subjectColor[deck.subject] ?? colors.blue;
          return (
            <View key={deck.id} style={styles.deck}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${deck.name}のカードを編集`} onPress={() => onOpenDeck(deck.id)}>
                <View style={styles.deckHead}>
                  <View style={[styles.chip, { backgroundColor: color }]}>
                    <Text style={styles.chipText}>{deck.subject}</Text>
                  </View>
                  <Text style={styles.edit}>編集 ›</Text>
                </View>
                <Text style={styles.deckName}>{deck.name}</Text>
                <Text style={styles.deckMeta}>
                  {p.total}枚 ／ 覚えた {p.known}枚 ／ もう一度 {p.again}枚
                </Text>
                <View style={{ marginTop: 8 }}>
                  <ProgressBar percent={p.percent} color={color} />
                  <Text style={styles.percent}>進捗 {p.percent}%</Text>
                </View>
              </Pressable>
              <View style={{ marginTop: 12 }}>
                <Button
                  label={p.total === 0 ? 'カードを追加しよう' : '学習する'}
                  tone={p.total === 0 ? 'ghost' : 'primary'}
                  onPress={() => (p.total === 0 ? onOpenDeck(deck.id) : onStudy(deck.id))}
                />
              </View>
            </View>
          );
        })}

        {creating ? (
          <View style={styles.form}>
            <Text style={styles.label}>教科</Text>
            <View style={styles.subjects}>
              {SUBJECTS.map((s) => {
                const on = s === subject;
                return (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setSubject(s)}
                    style={[styles.subjectBtn, on && { backgroundColor: subjectColor[s], borderColor: subjectColor[s] }]}
                  >
                    <Text style={[styles.subjectText, on && { color: '#fff' }]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>セット名</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError(null);
              }}
              placeholder="例：中2 英単語 Unit1"
              maxLength={LIMITS.deckName}
              style={styles.input}
              accessibilityLabel="セット名"
              autoCorrect={false}
              onSubmitEditing={submit}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={{ gap: 10, marginTop: 12 }}>
              <Button label="作成する" tone="purple" onPress={submit} />
              <Button
                label="やめる"
                tone="ghost"
                onPress={() => {
                  setCreating(false);
                  setError(null);
                }}
              />
            </View>
          </View>
        ) : (
          <Button label="＋ 新しいカードセットを作る" tone="purple" onPress={() => setCreating(true)} style={{ marginTop: 8 }} />
        )}
        <Text style={styles.footer}>広告・外部リンク・会員登録はありません</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingBottom: 48, gap: 14 },
  brand: { color: colors.purple, fontWeight: '800', letterSpacing: 2, fontSize: 14 },
  title: { fontSize: font.big, fontWeight: '800', color: colors.ink },
  notice: { backgroundColor: colors.blueSoft, borderRadius: 14, padding: 14 },
  noticeWarn: { backgroundColor: colors.warnSoft },
  noticeText: { color: colors.ink, fontSize: font.small, lineHeight: 23 },
  empty: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 2, borderColor: colors.line, borderStyle: 'dashed' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  emptyText: { fontSize: font.body, color: colors.sub, marginTop: 6, lineHeight: 26 },
  deck: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.line },
  deckHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  edit: { color: colors.sub, fontSize: font.small, fontWeight: '700' },
  deckName: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 8 },
  deckMeta: { fontSize: font.small, color: colors.sub, marginTop: 4 },
  percent: { fontSize: 14, color: colors.sub, marginTop: 4, fontWeight: '700' },
  form: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.line },
  label: { fontSize: font.small, fontWeight: '800', color: colors.sub, marginTop: 8, marginBottom: 6 },
  subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectBtn: { borderWidth: 2, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  subjectText: { fontSize: font.small, fontWeight: '700', color: colors.ink },
  input: { borderWidth: 2, borderColor: colors.line, borderRadius: 12, padding: 12, fontSize: font.body, color: colors.ink, backgroundColor: colors.bg, minHeight: 52 },
  error: { color: colors.danger, fontSize: font.small, marginTop: 6, fontWeight: '700' },
  footer: { textAlign: 'center', color: colors.sub, fontSize: 13, marginTop: 12 },
});
