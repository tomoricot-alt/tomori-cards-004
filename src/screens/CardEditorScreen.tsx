import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LIMITS, SUBJECTS, cardsOfDeck } from '../logic';
import { colors, font, subjectColor } from '../theme';
import type { AppData } from '../types';
import { Button, ConfirmModal, Screen } from '../components/ui';

export function CardEditorScreen({
  data,
  deckId,
  onBack,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onUpdateDeck,
  onDeleteDeck,
}: {
  data: AppData;
  deckId: string;
  onBack: () => void;
  onAddCard: (front: string, back: string) => string | null;
  onUpdateCard: (id: string, front: string, back: string) => string | null;
  onDeleteCard: (id: string) => void;
  onUpdateDeck: (name: string, subject: string) => string | null;
  onDeleteDeck: () => void;
}) {
  const deck = data.decks.find((d) => d.id === deckId);
  const cards = cardsOfDeck(data, deckId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [dName, setDName] = useState(deck?.name ?? '');
  const [dSubject, setDSubject] = useState(deck?.subject ?? SUBJECTS[0]);
  const [dError, setDError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'card'; id: string } | { kind: 'deck' } | null>(null);

  if (!deck) {
    return (
      <Screen>
        <View style={{ padding: 18 }}>
          <Button label="ホームにもどる" onPress={onBack} />
        </View>
      </Screen>
    );
  }

  const resetForm = () => {
    setEditingId(null);
    setFront('');
    setBack('');
    setError(null);
  };

  const submit = () => {
    const err = editingId ? onUpdateCard(editingId, front, back) : onAddCard(front, back);
    if (err) return setError(err);
    resetForm();
  };

  const startEdit = (id: string) => {
    const c = cards.find((x) => x.id === id);
    if (!c) return;
    setEditingId(id);
    setFront(c.front);
    setBack(c.back);
    setError(null);
  };

  const confirmed = () => {
    if (confirm?.kind === 'card') {
      if (editingId === confirm.id) resetForm();
      onDeleteCard(confirm.id);
    } else if (confirm?.kind === 'deck') {
      onDeleteDeck();
    }
    setConfirm(null);
  };

  const statusLabel = { new: '未学習', known: '覚えた', again: 'もう一度' } as const;
  const statusColor = { new: colors.sub, known: colors.ok, again: colors.warn } as const;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" accessibilityLabel="ホームにもどる" onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹ ホーム</Text>
        </Pressable>

        <View style={styles.headRow}>
          <View style={[styles.chip, { backgroundColor: subjectColor[deck.subject] ?? colors.blue }]}>
            <Text style={styles.chipText}>{deck.subject}</Text>
          </View>
          <Text style={styles.count}>{cards.length}/{LIMITS.maxCardsPerDeck}枚</Text>
        </View>
        <Text style={styles.title}>{deck.name}</Text>

        {renaming ? (
          <View style={styles.panel}>
            <View style={styles.subjects}>
              {SUBJECTS.map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityState={{ selected: s === dSubject }}
                  onPress={() => setDSubject(s)}
                  style={[styles.subjectBtn, s === dSubject && { backgroundColor: subjectColor[s], borderColor: subjectColor[s] }]}
                >
                  <Text style={[styles.subjectText, s === dSubject && { color: '#fff' }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={dName}
              onChangeText={(t) => {
                setDName(t);
                setDError(null);
              }}
              maxLength={LIMITS.deckName}
              style={[styles.input, { marginTop: 10 }]}
              accessibilityLabel="セット名"
            />
            {dError && <Text style={styles.error}>{dError}</Text>}
            <View style={{ gap: 10, marginTop: 12 }}>
              <Button
                label="セット情報を保存"
                tone="purple"
                onPress={() => {
                  const err = onUpdateDeck(dName, dSubject);
                  if (err) return setDError(err);
                  setRenaming(false);
                }}
              />
              <Button label="やめる" tone="ghost" onPress={() => setRenaming(false)} />
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <Button
              label="セット名を変更"
              tone="ghost"
              style={{ flex: 1 }}
              onPress={() => {
                setDName(deck.name);
                setDSubject(deck.subject);
                setDError(null);
                setRenaming(true);
              }}
            />
            <Button label="セットを削除" tone="ghost" style={{ flex: 1 }} onPress={() => setConfirm({ kind: 'deck' })} />
          </View>
        )}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{editingId ? 'カードを編集（学習状態は未学習にもどります）' : '新しいカードを追加'}</Text>
          <Text style={styles.label}>表面（問題）</Text>
          <TextInput
            value={front}
            onChangeText={(t) => {
              setFront(t);
              setError(null);
            }}
            placeholder="例：apple"
            maxLength={LIMITS.cardText}
            multiline
            style={[styles.input, styles.multi]}
            accessibilityLabel="表面（問題）"
          />
          <Text style={styles.label}>裏面（答え）</Text>
          <TextInput
            value={back}
            onChangeText={(t) => {
              setBack(t);
              setError(null);
            }}
            placeholder="例：りんご"
            maxLength={LIMITS.cardText}
            multiline
            style={[styles.input, styles.multi]}
            accessibilityLabel="裏面（答え）"
          />
          <Text style={styles.small}>{LIMITS.cardText}文字まで</Text>
          {error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}
          <View style={{ gap: 10, marginTop: 12 }}>
            <Button label={editingId ? '変更を保存' : 'カードを追加'} tone="purple" onPress={submit} />
            {editingId && <Button label="編集をやめる" tone="ghost" onPress={resetForm} />}
          </View>
        </View>

        <Text style={styles.sectionTitle}>カード一覧</Text>
        {cards.length === 0 && <Text style={styles.empty}>まだカードがありません。上のフォームから追加しよう。</Text>}
        {cards.map((c) => (
          <View key={c.id} style={[styles.card, editingId === c.id && { borderColor: colors.purple }]}>
            <Text style={[styles.status, { color: statusColor[c.status] }]}>{statusLabel[c.status]}</Text>
            <Text style={styles.cardFront}>{c.front}</Text>
            <Text style={styles.cardBack}>→ {c.back}</Text>
            <View style={[styles.row, { marginTop: 10 }]}>
              <Button label="編集" tone="ghost" style={{ flex: 1, minHeight: 44, paddingVertical: 8 }} onPress={() => startEdit(c.id)} />
              <Button label="削除" tone="ghost" style={{ flex: 1, minHeight: 44, paddingVertical: 8 }} onPress={() => setConfirm({ kind: 'card', id: c.id })} />
            </View>
          </View>
        ))}
      </ScrollView>

      <ConfirmModal
        visible={confirm !== null}
        title={confirm?.kind === 'deck' ? 'このセットを削除しますか？' : 'このカードを削除しますか？'}
        message={confirm?.kind === 'deck' ? `「${deck.name}」と中のカード${cards.length}枚がすべて消えます。元にもどせません。` : '削除すると元にもどせません。'}
        confirmLabel="削除する"
        onConfirm={confirmed}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingBottom: 48, gap: 12 },
  back: { minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: font.body, fontWeight: '800', color: colors.blue },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  count: { color: colors.sub, fontSize: font.small },
  title: { fontSize: font.title, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', gap: 10 },
  panel: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.line },
  panelTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  label: { fontSize: font.small, fontWeight: '800', color: colors.sub, marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 2, borderColor: colors.line, borderRadius: 12, padding: 12, fontSize: font.body, color: colors.ink, backgroundColor: colors.bg, minHeight: 52 },
  multi: { minHeight: 84, textAlignVertical: 'top' },
  small: { color: colors.sub, fontSize: 13, marginTop: 4 },
  error: { color: colors.danger, fontSize: font.small, marginTop: 8, fontWeight: '700' },
  subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectBtn: { borderWidth: 2, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  subjectText: { fontSize: font.small, fontWeight: '700', color: colors.ink },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 8 },
  empty: { color: colors.sub, fontSize: font.body },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 2, borderColor: colors.line },
  status: { fontSize: 13, fontWeight: '800' },
  cardFront: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 4 },
  cardBack: { fontSize: font.body, color: colors.sub, marginTop: 4 },
});
