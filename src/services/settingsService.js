import { supabase, isSupabaseConfigured, getInitialData, setStoredData } from './dataStore';

const STORAGE_KEY = 'settings';

const DEFAULT_SETTINGS = {
  business_name: 'echaii',
  email: 'admin@echaii.com',
  phone: '+91 98765 43210',
  address: 'Commercial Tower, Cyber City, Gurugram, India',
  default_cup_price: 20,
  low_stock_threshold: 100,
  currency: 'INR',
  gst_number: '07AAAAA0000A1Z5',
};

export const settingsService = {
  async getSettings() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Settings error:', error);
      }
      if (data) return data;
    }
    return getInitialData(STORAGE_KEY, DEFAULT_SETTINGS);
  },

  async updateSettings(settings) {
    if (isSupabaseConfigured) {
      const existing = await this.getSettings();
      if (existing?.id) {
        const { data, error } = await supabase
          .from('business_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('business_settings')
          .insert([settings])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    setStoredData(STORAGE_KEY, settings);
    return settings;
  },
};
