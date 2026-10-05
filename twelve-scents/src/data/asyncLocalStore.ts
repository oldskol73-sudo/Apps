import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalStore } from './repository';

export const asyncLocalStore: LocalStore = {
  async read<T>(key: string) {
    try {
      const v = await AsyncStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch { return null; }
  },
  async write<T>(key: string, value: T) {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/unavailable: non-fatal */ }
  },
};
