const CACHE_STORE_KEY = "__cropeyeSessionCache__";

function getCacheStore() {
  if (!globalThis[CACHE_STORE_KEY]) {
    globalThis[CACHE_STORE_KEY] = {};
  }
  return globalThis[CACHE_STORE_KEY];
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
  globalThis[CACHE_STORE_KEY] = {};
}
