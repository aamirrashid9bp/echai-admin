import { supabase, isSupabaseConfigured, getInitialData, setStoredData } from './dataStore';
import { calculateClosingStock } from '../utils/calculations';

const STORAGE_KEY = 'inventory';

export const inventoryService = {
  async getInventory() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, locations(name)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((item) => ({
        ...item,
        location_name: item.locations?.name || 'Unassigned',
      }));
    }
    return getInitialData(STORAGE_KEY, []);
  },

  async addInventoryLog(item) {
    const opening = parseInt(item.opening_stock, 10) || 0;
    const purchased = parseInt(item.purchased_cups, 10) || 0;
    const sold = parseInt(item.sold_cups, 10) || 0;
    const wastage = parseInt(item.wastage, 10) || 0;
    const closing = calculateClosingStock(opening, purchased, sold, wastage);

    const record = {
      location_id: item.location_id || null,
      location_name: item.location_name || 'Unassigned',
      date: item.date || new Date().toISOString().split('T')[0],
      opening_stock: opening,
      purchased_cups: purchased,
      sold_cups: sold,
      wastage,
      closing_stock: closing,
      notes: item.notes || '',
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('inventory')
        .insert([{
          location_id: record.location_id,
          date: record.date,
          opening_stock: record.opening_stock,
          purchased_cups: record.purchased_cups,
          sold_cups: record.sold_cups,
          wastage: record.wastage,
          closing_stock: record.closing_stock,
          notes: record.notes,
        }])
        .select('*, locations(name)')
        .single();
      if (error) throw error;
      return {
        ...data,
        location_name: data.locations?.name || record.location_name,
      };
    }

    const current = getInitialData(STORAGE_KEY, []);
    const newLog = {
      id: 'inv_' + Date.now() + Math.random().toString(36).substr(2, 4),
      ...record,
      created_at: new Date().toISOString(),
    };
    const updated = [newLog, ...current];
    setStoredData(STORAGE_KEY, updated);
    return newLog;
  },

  async updateInventoryLog(id, item) {
    const opening = parseInt(item.opening_stock, 10) || 0;
    const purchased = parseInt(item.purchased_cups, 10) || 0;
    const sold = parseInt(item.sold_cups, 10) || 0;
    const wastage = parseInt(item.wastage, 10) || 0;
    const closing = calculateClosingStock(opening, purchased, sold, wastage);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('inventory')
        .update({
          location_id: item.location_id,
          date: item.date,
          opening_stock: opening,
          purchased_cups: purchased,
          sold_cups: sold,
          wastage,
          closing_stock: closing,
          notes: item.notes,
        })
        .eq('id', id)
        .select('*, locations(name)')
        .single();
      if (error) throw error;
      return {
        ...data,
        location_name: data.locations?.name || item.location_name,
      };
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            location_id: item.location_id,
            location_name: item.location_name || inv.location_name,
            date: item.date,
            opening_stock: opening,
            purchased_cups: purchased,
            sold_cups: sold,
            wastage,
            closing_stock: closing,
            notes: item.notes,
          }
        : inv
    );
    setStoredData(STORAGE_KEY, updated);
    return updated.find((i) => i.id === id);
  },

  async deleteInventoryLog(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.filter((inv) => inv.id !== id);
    setStoredData(STORAGE_KEY, updated);
    return true;
  },
};
