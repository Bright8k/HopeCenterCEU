import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';
import 'react-native-get-random-values';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const { supabaseUrl, supabasePublishableKey } = Constants.expoConfig?.extra ?? {};
const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_placeholder';

export const hasSupabaseEnv = Boolean(supabaseUrl && supabasePublishableKey);

type SupabaseStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

class LargeSecureStore {
  private async _encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(`${key}.key`, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async _decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(`${key}.key`);
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    );
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(key: string) {
    const encrypted = await SecureStore.getItemAsync(key);
    if (!encrypted) return null;
    return this._decrypt(key, encrypted);
  }

  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
    await SecureStore.deleteItemAsync(`${key}.key`);
  }

  async setItem(key: string, value: string) {
    const encrypted = await this._encrypt(key, value);
    await SecureStore.setItemAsync(key, encrypted);
  }
}

class WebStorage implements SupabaseStorage {
  async getItem(key: string) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  }

  async removeItem(key: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  }
}

const storage: SupabaseStorage =
  Platform.OS === 'web' ? new WebStorage() : new LargeSecureStore();

function createSupabaseClient() {
  return createClient<Database>(
    supabaseUrl ?? FALLBACK_SUPABASE_URL,
    supabasePublishableKey ?? FALLBACK_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __hopeCenterSupabase__: SupabaseClient<Database> | undefined;
}

export const supabase =
  globalThis.__hopeCenterSupabase__ ?? createSupabaseClient();

if (!globalThis.__hopeCenterSupabase__) {
  globalThis.__hopeCenterSupabase__ = supabase;
}
