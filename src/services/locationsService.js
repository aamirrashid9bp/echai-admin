import { supabase, isSupabaseConfigured, getInitialData, setStoredData } from './dataStore';

const STORAGE_KEY = 'locations';

export const locationsService = {
  async getLocations() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getInitialData(STORAGE_KEY, []);
  },

  async addLocation(locationData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('locations')
        .insert([{
          name: locationData.name,
          address: locationData.address || '',
          contact_person: locationData.contactPerson || '',
          phone: locationData.phone || '',
          status: locationData.status || 'active',
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const current = getInitialData(STORAGE_KEY, []);
    const newLoc = {
      id: 'loc_' + Date.now() + Math.random().toString(36).substr(2, 4),
      name: locationData.name,
      address: locationData.address || '',
      contact_person: locationData.contactPerson || '',
      phone: locationData.phone || '',
      status: locationData.status || 'active',
      created_at: new Date().toISOString(),
    };
    const updated = [newLoc, ...current];
    setStoredData(STORAGE_KEY, updated);
    return newLoc;
  },

  async updateLocation(id, locationData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('locations')
        .update({
          name: locationData.name,
          address: locationData.address,
          contact_person: locationData.contactPerson,
          phone: locationData.phone,
          status: locationData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.map((loc) =>
      loc.id === id
        ? {
            ...loc,
            name: locationData.name,
            address: locationData.address,
            contact_person: locationData.contactPerson,
            phone: locationData.phone,
            status: locationData.status,
            updated_at: new Date().toISOString(),
          }
        : loc
    );
    setStoredData(STORAGE_KEY, updated);
    return updated.find((l) => l.id === id);
  },

  async deleteLocation(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.filter((loc) => loc.id !== id);
    setStoredData(STORAGE_KEY, updated);
    return true;
  },
};
