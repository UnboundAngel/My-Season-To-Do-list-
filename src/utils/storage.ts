export interface StorageAdapter<T> {
  load(): T;
  save(value: T): void;
}

export function createLocalStorageAdapter<T>(key: string, fallback: T): StorageAdapter<T> {
  return {
    load() {
      if (typeof window === 'undefined') return fallback;
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return structuredClone(fallback);
        const parsed = JSON.parse(raw) as T;
        return parsed ?? structuredClone(fallback);
      } catch (err) {
        console.warn('[storage] failed to parse', err);
        return structuredClone(fallback);
      }
    },
    save(value) {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  };
}
