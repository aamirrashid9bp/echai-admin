// Local database store helper with persistence and Supabase integration
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_PREFIX = 'echaii_admin_';

const getInitialData = (key, defaultVal = []) => {
  try {
    const item = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setStoredData = (key, data) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist to localStorage', err);
  }
};

export { isSupabaseConfigured, supabase, getInitialData, setStoredData };
