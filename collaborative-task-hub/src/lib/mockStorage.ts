export const loadJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export const removeKey = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

export const randomId = (prefix = '') => {
  const core = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${core}` : core;
};

export const nowIso = () => new Date().toISOString();
