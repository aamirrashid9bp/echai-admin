import { supabase, isSupabaseConfigured, getInitialData, setStoredData } from './dataStore';

const STORAGE_KEY = 'users';

const DEFAULT_USERS = [
  {
    id: 'user_1',
    email: 'admin@echaii.com',
    full_name: 'Super Admin',
    role: 'admin',
    phone: '+91 9876543210',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user_2',
    email: 'manager@echaii.com',
    full_name: 'Operations Manager',
    role: 'manager',
    phone: '+91 9876543211',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user_3',
    email: 'staff@echaii.com',
    full_name: 'Counter Staff',
    role: 'staff',
    phone: '+91 9876543212',
    created_at: new Date().toISOString(),
  },
];

export const usersService = {
  async getUsers() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getInitialData(STORAGE_KEY, DEFAULT_USERS);
  },

  async addUser(userData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role || 'staff',
          phone: userData.phone || '',
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const current = getInitialData(STORAGE_KEY, DEFAULT_USERS);
    const newUser = {
      id: 'user_' + Date.now(),
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role || 'staff',
      phone: userData.phone || '',
      created_at: new Date().toISOString(),
    };
    const updated = [newUser, ...current];
    setStoredData(STORAGE_KEY, updated);
    return newUser;
  },

  async updateUserRole(id, role) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const current = getInitialData(STORAGE_KEY, DEFAULT_USERS);
    const updated = current.map((u) => (u.id === id ? { ...u, role } : u));
    setStoredData(STORAGE_KEY, updated);
    return updated.find((u) => u.id === id);
  },

  async deleteUser(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const current = getInitialData(STORAGE_KEY, DEFAULT_USERS);
    const updated = current.filter((u) => u.id !== id);
    setStoredData(STORAGE_KEY, updated);
    return true;
  },
};
