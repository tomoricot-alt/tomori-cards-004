import type { AppData, Card, CardStatus, Deck, StudyMode } from './types';

export const LIMITS = {
  deckName: 30,
  cardText: 200,
  maxDecks: 50,
  maxCardsPerDeck: 1000,
} as const;

export const SUBJECTS = ['英語', '歴史', '理科', '数学', '国語・漢字', 'その他'] as const;

export const EMPTY_DATA: AppData = { version: 1, decks: [], cards: [] };

/** 制御文字を除去し、前後の空白を削る（改行は許可） */
export function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateDeckInput(name: string, subject: string): Validation<{ name: string; subject: string }> {
  const n = cleanText(name).replace(/\s+/g, ' ');
  if (!n) return { ok: false, error: 'セット名を入力してください。' };
  if (n.length > LIMITS.deckName) return { ok: false, error: `セット名は${LIMITS.deckName}文字までです。` };
  const s = (SUBJECTS as readonly string[]).includes(subject) ? subject : 'その他';
  return { ok: true, value: { name: n, subject: s } };
}

export function validateCardInput(front: string, back: string): Validation<{ front: string; back: string }> {
  const f = cleanText(front);
  const b = cleanText(back);
  if (!f) return { ok: false, error: '表面（問題）を入力してください。' };
  if (!b) return { ok: false, error: '裏面（答え）を入力してください。' };
  if (f.length > LIMITS.cardText || b.length > LIMITS.cardText) {
    return { ok: false, error: `表面・裏面は${LIMITS.cardText}文字までです。` };
  }
  return { ok: true, value: { front: f, back: b } };
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Fisher-Yates。元の配列は変更しない */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardsOfDeck(data: AppData, deckId: string): Card[] {
  return data.cards.filter((c) => c.deckId === deckId);
}

export interface Progress {
  total: number;
  known: number;
  again: number;
  fresh: number;
  percent: number;
}

export function progressOf(cards: readonly Card[]): Progress {
  const total = cards.length;
  const known = cards.filter((c) => c.status === 'known').length;
  const again = cards.filter((c) => c.status === 'again').length;
  return { total, known, again, fresh: total - known - again, percent: total === 0 ? 0 : Math.round((known / total) * 100) };
}

/** 学習するカードの並びを作る。review は「もう一度」のカードのみ */
export function buildQueue(cards: readonly Card[], mode: StudyMode, doShuffle: boolean, rng: () => number = Math.random): Card[] {
  const target = mode === 'review' ? cards.filter((c) => c.status === 'again') : cards.slice();
  return doShuffle ? shuffle(target, rng) : target;
}

// ---- データ操作（すべて純粋関数） ----

export function addDeck(data: AppData, name: string, subject: string, now = Date.now()): Validation<AppData> {
  const v = validateDeckInput(name, subject);
  if (!v.ok) return v;
  if (data.decks.length >= LIMITS.maxDecks) return { ok: false, error: `セットは${LIMITS.maxDecks}個までです。` };
  const deck: Deck = { id: newId(), name: v.value.name, subject: v.value.subject, createdAt: now };
  return { ok: true, value: { ...data, decks: [...data.decks, deck] } };
}

export function updateDeck(data: AppData, id: string, name: string, subject: string): Validation<AppData> {
  const v = validateDeckInput(name, subject);
  if (!v.ok) return v;
  if (!data.decks.some((d) => d.id === id)) return { ok: false, error: 'セットが見つかりません。' };
  return { ok: true, value: { ...data, decks: data.decks.map((d) => (d.id === id ? { ...d, ...v.value } : d)) } };
}

export function deleteDeck(data: AppData, id: string): AppData {
  return { ...data, decks: data.decks.filter((d) => d.id !== id), cards: data.cards.filter((c) => c.deckId !== id) };
}

export function addCard(data: AppData, deckId: string, front: string, back: string, now = Date.now()): Validation<AppData> {
  const v = validateCardInput(front, back);
  if (!v.ok) return v;
  if (!data.decks.some((d) => d.id === deckId)) return { ok: false, error: 'セットが見つかりません。' };
  if (cardsOfDeck(data, deckId).length >= LIMITS.maxCardsPerDeck) {
    return { ok: false, error: `1セットのカードは${LIMITS.maxCardsPerDeck}枚までです。` };
  }
  const card: Card = { id: newId(), deckId, ...v.value, status: 'new', updatedAt: now };
  return { ok: true, value: { ...data, cards: [...data.cards, card] } };
}

export function updateCard(data: AppData, id: string, front: string, back: string, now = Date.now()): Validation<AppData> {
  const v = validateCardInput(front, back);
  if (!v.ok) return v;
  if (!data.cards.some((c) => c.id === id)) return { ok: false, error: 'カードが見つかりません。' };
  return {
    ok: true,
    value: { ...data, cards: data.cards.map((c) => (c.id === id ? { ...c, ...v.value, status: 'new', updatedAt: now } : c)) },
  };
}

export function deleteCard(data: AppData, id: string): AppData {
  return { ...data, cards: data.cards.filter((c) => c.id !== id) };
}

export function setCardStatus(data: AppData, id: string, status: CardStatus, now = Date.now()): AppData {
  return { ...data, cards: data.cards.map((c) => (c.id === id ? { ...c, status, updatedAt: now } : c)) };
}

export function resetDeckProgress(data: AppData, deckId: string): AppData {
  return { ...data, cards: data.cards.map((c) => (c.deckId === deckId ? { ...c, status: 'new' as const } : c)) };
}

// ---- 保存データの検証（壊れたデータ・改ざんに対する防御） ----

function isStatus(v: unknown): v is CardStatus {
  return v === 'new' || v === 'known' || v === 'again';
}

/** 文字列から AppData を復元。不正な要素は捨てる。全体が不正なら null */
export function parseData(raw: string | null): AppData | null {
  if (!raw) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== 'object' || obj === null) return null;
  const o = obj as Record<string, unknown>;
  if (o.version !== 1 || !Array.isArray(o.decks) || !Array.isArray(o.cards)) return null;

  const decks: Deck[] = [];
  const deckIds = new Set<string>();
  for (const d of o.decks.slice(0, LIMITS.maxDecks)) {
    if (typeof d !== 'object' || d === null) continue;
    const r = d as Record<string, unknown>;
    const name = cleanText(r.name).slice(0, LIMITS.deckName);
    if (typeof r.id !== 'string' || !r.id || !name || deckIds.has(r.id)) continue;
    const subject = typeof r.subject === 'string' && (SUBJECTS as readonly string[]).includes(r.subject) ? r.subject : 'その他';
    decks.push({ id: r.id, name, subject, createdAt: typeof r.createdAt === 'number' ? r.createdAt : 0 });
    deckIds.add(r.id);
  }

  const cards: Card[] = [];
  const cardIds = new Set<string>();
  const perDeck = new Map<string, number>();
  for (const c of o.cards) {
    if (typeof c !== 'object' || c === null) continue;
    const r = c as Record<string, unknown>;
    const front = cleanText(r.front).slice(0, LIMITS.cardText);
    const back = cleanText(r.back).slice(0, LIMITS.cardText);
    if (typeof r.id !== 'string' || !r.id || cardIds.has(r.id)) continue;
    if (typeof r.deckId !== 'string' || !deckIds.has(r.deckId) || !front || !back) continue;
    const n = perDeck.get(r.deckId) ?? 0;
    if (n >= LIMITS.maxCardsPerDeck) continue;
    perDeck.set(r.deckId, n + 1);
    cards.push({
      id: r.id,
      deckId: r.deckId,
      front,
      back,
      status: isStatus(r.status) ? r.status : 'new',
      updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
    });
    cardIds.add(r.id);
  }
  return { version: 1, decks, cards };
}
