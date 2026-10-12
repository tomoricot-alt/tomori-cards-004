import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_DATA, parseData } from './logic';
import type { AppData } from './types';

export const STORAGE_KEY = 'tomori-cards-004:data:v1';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** Web は localStorage、iOS/Android は AsyncStorage。すべて端末内のみ */
const defaultStore: KeyValueStore = {
  async getItem(key) {
    if (Platform.OS === 'web') return globalThis.localStorage.getItem(key);
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') return globalThis.localStorage.setItem(key, value);
    return AsyncStorage.setItem(key, value);
  },
};

export interface LoadResult {
  data: AppData;
  /** 保存データが壊れていて読み込めなかった場合 true */
  corrupted: boolean;
}

export async function loadData(store: KeyValueStore = defaultStore): Promise<LoadResult> {
  try {
    const raw = await store.getItem(STORAGE_KEY);
    if (raw === null) return { data: EMPTY_DATA, corrupted: false };
    const parsed = parseData(raw);
    if (!parsed) return { data: EMPTY_DATA, corrupted: true };
    return { data: parsed, corrupted: false };
  } catch {
    return { data: EMPTY_DATA, corrupted: false };
  }
}

/** 保存に成功したら true（容量超過・プライベートモード等では false） */
export async function saveData(data: AppData, store: KeyValueStore = defaultStore): Promise<boolean> {
  try {
    await store.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
