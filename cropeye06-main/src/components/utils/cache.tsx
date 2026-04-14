const CACHE_STORE_KEY = "__cropeyeSessionCache__";

function getCacheStore() {
  const globalScope = globalThis as typeof globalThis & {
    [CACHE_STORE_KEY]?: Record<string, { data: any; timestamp: number }>;
  };

  if (!globalScope[CACHE_STORE_KEY]) {
    globalScope[CACHE_STORE_KEY] = {};
  }

  return globalScope[CACHE_STORE_KEY]!;
}

export function setCache(key, data) {
  const store = getCacheStore();
  store[key] = {
    data,
    timestamp: Date.now(),
  };
}

export function getCache(key, maxAgeMs = 10 * 60 * 1000) {
  const store = getCacheStore();
  const payload = store[key];
  if (!payload) return null;

  if (Date.now() - payload.timestamp > maxAgeMs) {
    delete store[key];
    return null;
  }

  return payload.data;
}

export function removeCache(key) {
  const store = getCacheStore();
  delete store[key];
}

export function clearAllCache() {
  const globalScope = globalThis as typeof globalThis & {
    [CACHE_STORE_KEY]?: Record<string, { data: any; timestamp: number }>;
  };
  globalScope[CACHE_STORE_KEY] = {};
}
