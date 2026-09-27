// zustand v5's persist hands a storage adapter an already-structured
// `{ state, version }` object, not a JSON string (see zustand/middleware.js).
// Accept both shapes so the adapter is not coupled to that detail, and so
// sessions written by an older build still rehydrate.
export const toEnvelope = (value) =>
  typeof value === 'string' ? JSON.parse(value) : value;

export const authStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name) || sessionStorage.getItem(name);
    if (!raw) return null;
    try {
      return toEnvelope(raw);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    const envelope = toEnvelope(value);
    const rememberMe = envelope?.state?.rememberMe;
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(name);
    storage.setItem(name, JSON.stringify(envelope));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

// The auth API returns the user with `id`; components use `_id`.
// Normalize so both are always present.
export const normalizeUser = (user) => {
  if (!user) return user;
  return {
    ...user,
    _id: user._id || user.id,
    id: user.id || user._id,
  };
};
