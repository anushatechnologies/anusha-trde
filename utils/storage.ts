import * as SecureStore from 'expo-secure-store';

const isSecureStoreAvailable = async () => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

const getWebStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

export const readSecure = async <T>(key: string): Promise<T | null> => {
  if (await isSecureStoreAvailable()) {
    const rawValue = await SecureStore.getItemAsync(key);
    if (!rawValue) {
      return null;
    }
    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }

  const webStorage = getWebStorage();
  if (webStorage) {
    const rawValue = webStorage.getItem(key);
    if (!rawValue) {
      return null;
    }
    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }

  return null;
};

export const writeSecure = async <T>(key: string, value: T) => {
  if (await isSecureStoreAvailable()) {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(value));
    } catch {
      // Silent fallback
    }
    return;
  }

  try {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Silent fallback
  }
};

export const removeSecure = async (key: string) => {
  if (await isSecureStoreAvailable()) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Silent fallback
    }
    return;
  }

  try {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.removeItem(key);
    }
  } catch {
    // Silent fallback
  }
};

