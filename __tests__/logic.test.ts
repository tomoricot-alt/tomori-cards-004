import {
  EMPTY_DATA,
  LIMITS,
  addCard,
  addDeck,
  buildQueue,
  cardsOfDeck,
  deleteCard,
  deleteDeck,
  parseData,
  progressOf,
  resetDeckProgress,
  setCardStatus,
  shuffle,
  updateCard,
  updateDeck,
  validateCardInput,
  validateDeckInput,
} from '../src/logic';
import type { AppData } from '../src/types';

function ok<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function seed(): { data: AppData; deckId: string } {
  let d = ok(addDeck(EMPTY_DATA, '英単語', '英語'));
  const deckId = d.decks[0].id;
  d = ok(addCard(d, deckId, 'apple', 'りんご'));
  d = ok(addCard(d, deckId, 'book', '本'));
  d = ok(addCard(d, deckId, 'cat', '猫'));
  return { data: d, deckId };
}

describe('入力検証', () => {
  test('空・空白だけの入力は拒否', () => {
    expect(validateCardInput('', 'a').ok).toBe(false);
    expect(validateCardInput('a', '   ').ok).toBe(false);
    expect(validateDeckInput('  ', '英語').ok).toBe(false);
  });
  test('長すぎる入力は拒否', () => {
    expect(validateCardInput('a'.repeat(LIMITS.cardText + 1), 'b').ok).toBe(false);
    expect(validateDeckInput('a'.repeat(LIMITS.deckName + 1), '英語').ok).toBe(false);
  });
  test('制御文字は除去され、改行は保持', () => {
    const r = ok(validateCardInput('a\u0000b\nc', '\u0007答え'));
    expect(r.front).toBe('ab\nc');
    expect(r.back).toBe('答え');
  });
  test('不明な教科は「その他」になる', () => {
    expect(ok(validateDeckInput('x', 'zzz')).subject).toBe('その他');
  });
  test('文字列以外が来ても落ちない', () => {
    expect(validateCardInput(undefined as unknown as string, null as unknown as string).ok).toBe(false);
  });
});

describe('カード・セット操作', () => {
  test('作成・編集・削除', () => {
    const { data, deckId } = seed();
    expect(cardsOfDeck(data, deckId)).toHaveLength(3);
    const id = data.cards[0].id;
    const d2 = ok(updateCard(data, id, 'apples', 'りんご（複数）'));
    expect(d2.cards[0].front).toBe('apples');
    expect(deleteCard(d2, id).cards).toHaveLength(2);
  });
  test('編集すると学習状態は未学習に戻る', () => {
    const { data } = seed();
    const id = data.cards[0].id;
    const known = setCardStatus(data, id, 'known');
    expect(updateCard(known, id, 'x', 'y').ok && ok(updateCard(known, id, 'x', 'y')).cards[0].status).toBe('new');
  });
  test('不正な編集は元データを変えない', () => {
    const { data } = seed();
    expect(updateCard(data, data.cards[0].id, '', 'x').ok).toBe(false);
    expect(updateCard(data, 'nope', 'a', 'b').ok).toBe(false);
    expect(addCard(data, 'nope', 'a', 'b').ok).toBe(false);
  });
  test('セット削除でカードも消える', () => {
    const { data, deckId } = seed();
    const d = deleteDeck(data, deckId);
    expect(d.decks).toHaveLength(0);
    expect(d.cards).toHaveLength(0);
  });
  test('セット名変更', () => {
    const { data, deckId } = seed();
    const d = ok(updateDeck(data, deckId, '歴史年号', '歴史'));
    expect(d.decks[0]).toMatchObject({ name: '歴史年号', subject: '歴史' });
  });
  test('上限を超えて追加できない', () => {
    let d = ok(addDeck(EMPTY_DATA, 'a', '英語'));
    const id = d.decks[0].id;
    for (let i = 0; i < LIMITS.maxCardsPerDeck; i++) d = ok(addCard(d, id, `q${i}`, `a${i}`));
    expect(addCard(d, id, 'x', 'y').ok).toBe(false);
  });
});

describe('シャッフル・復習・進捗', () => {
  test('シャッフルは同じ要素を保ち、元配列を変更しない', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = src.slice();
    const out = shuffle(src);
    expect(src).toEqual(copy);
    expect(out.slice().sort()).toEqual(copy);
  });
  test('乱数固定で順序が変わる（決定的）', () => {
    let i = 0;
    const rng = () => [0.1, 0.9, 0.5, 0.3][i++ % 4];
    expect(shuffle([1, 2, 3, 4, 5], rng)).not.toEqual([1, 2, 3, 4, 5]);
  });
  test('進捗の集計', () => {
    const { data } = seed();
    let d = setCardStatus(data, data.cards[0].id, 'known');
    d = setCardStatus(d, data.cards[1].id, 'again');
    expect(progressOf(d.cards)).toEqual({ total: 3, known: 1, again: 1, fresh: 1, percent: 33 });
    expect(progressOf([]).percent).toBe(0);
  });
  test('復習モードは「もう一度」のカードだけ', () => {
    const { data } = seed();
    const d = setCardStatus(data, data.cards[1].id, 'again');
    const q = buildQueue(d.cards, 'review', true);
    expect(q.map((c) => c.front)).toEqual(['book']);
    expect(buildQueue(d.cards, 'all', false)).toHaveLength(3);
  });
  test('進捗リセット', () => {
    const { data, deckId } = seed();
    const d = resetDeckProgress(setCardStatus(data, data.cards[0].id, 'known'), deckId);
    expect(progressOf(d.cards).known).toBe(0);
  });
});

describe('保存データの復元', () => {
  test('往復で同一', () => {
    const { data } = seed();
    expect(parseData(JSON.stringify(data))).toEqual(data);
  });
  test('壊れたJSON・形式違いは null', () => {
    expect(parseData(null)).toBeNull();
    expect(parseData('{bad')).toBeNull();
    expect(parseData('123')).toBeNull();
    expect(parseData('{"version":2,"decks":[],"cards":[]}')).toBeNull();
  });
  test('不正な要素は捨て、正しい要素は残す', () => {
    const { data } = seed();
    const bad = {
      ...data,
      cards: [
        ...data.cards,
        { id: 'x1', deckId: 'missing', front: 'a', back: 'b', status: 'new', updatedAt: 0 },
        { id: 'x2', deckId: data.decks[0].id, front: '', back: 'b', status: 'new', updatedAt: 0 },
        { id: data.cards[0].id, deckId: data.decks[0].id, front: 'dup', back: 'b', status: 'new', updatedAt: 0 },
        { id: 'x3', deckId: data.decks[0].id, front: 'z'.repeat(999), back: 'b', status: 'hack', updatedAt: 0 },
        null,
        'str',
      ],
    };
    const r = parseData(JSON.stringify(bad))!;
    expect(r.cards).toHaveLength(4);
    const x3 = r.cards.find((c) => c.id === 'x3')!;
    expect(x3.front).toHaveLength(LIMITS.cardText);
    expect(x3.status).toBe('new');
  });
});
