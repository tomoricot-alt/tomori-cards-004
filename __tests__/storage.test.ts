jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { STORAGE_KEY, loadData, saveData, type KeyValueStore } from '../src/storage';
import { EMPTY_DATA, addCard, addDeck } from '../src/logic';

function memoryStore(init: Record<string, string> = {}): KeyValueStore & { map: Record<string, string> } {
  const map = { ...init };
  return {
    map,
    getItem: async (k) => (k in map ? map[k] : null),
    setItem: async (k, v) => {
      map[k] = v;
    },
  };
}

test('保存したデータを「再読み込み」後に復元できる', async () => {
  const store = memoryStore();
  const d = addDeck(EMPTY_DATA, '理科', '理科');
  if (!d.ok) throw new Error();
  const c = addCard(d.value, d.value.decks[0].id, '水の化学式', 'H2O');
  if (!c.ok) throw new Error();
  expect(await saveData(c.value, store)).toBe(true);
  const reloaded = await loadData(store);
  expect(reloaded.corrupted).toBe(false);
  expect(reloaded.data).toEqual(c.value);
});

test('初回は空データ', async () => {
  expect(await loadData(memoryStore())).toEqual({ data: EMPTY_DATA, corrupted: false });
});

test('壊れたデータは空で起動し corrupted を通知', async () => {
  const r = await loadData(memoryStore({ [STORAGE_KEY]: '{broken' }));
  expect(r.corrupted).toBe(true);
  expect(r.data).toEqual(EMPTY_DATA);
});

test('保存失敗（容量超過など）は false を返し例外にしない', async () => {
  const failing: KeyValueStore = { getItem: async () => null, setItem: async () => { throw new Error('QuotaExceeded'); } };
  expect(await saveData(EMPTY_DATA, failing)).toBe(false);
});

test('読み込みで例外が出ても空データで起動', async () => {
  const failing: KeyValueStore = { getItem: async () => { throw new Error('denied'); }, setItem: async () => {} };
  expect((await loadData(failing)).data).toEqual(EMPTY_DATA);
});
