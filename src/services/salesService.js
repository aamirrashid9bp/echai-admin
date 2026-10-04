import { supabase, isSupabaseConfigured, getInitialData, setStoredData } from './dataStore';
import { calculateTotalRevenue } from '../utils/calculations';

const STORAGE_KEY = 'sales';

export const salesService = {
  async getSales() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('sales')
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

  async addSale(saleData) {
    const cups = parseInt(saleData.cups_sold, 10) || 0;
    const price = parseFloat(saleData.selling_price_per_cup) || 0;
    const total_revenue = calculateTotalRevenue(cups, price);

    const record = {
      location_id: saleData.location_id || null,
      location_name: saleData.location_name || 'Unassigned',
      date: saleData.date || new Date().toISOString().split('T')[0],
      cups_sold: cups,
      selling_price_per_cup: price,
      total_revenue,
      notes: saleData.notes || '',
      created_by: saleData.created_by || 'Admin',
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('sales')
        .insert([{
          location_id: record.location_id,
          date: record.date,
          cups_sold: record.cups_sold,
          selling_price_per_cup: record.selling_price_per_cup,
          total_revenue: record.total_revenue,
          notes: record.notes,
          created_by: record.created_by,
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
    const newSale = {
      id: 'sale_' + Date.now() + Math.random().toString(36).substr(2, 4),
      ...record,
      created_at: new Date().toISOString(),
    };
    const updated = [newSale, ...current];
    setStoredData(STORAGE_KEY, updated);
    return newSale;
  },

  async updateSale(id, saleData) {
    const cups = parseInt(saleData.cups_sold, 10) || 0;
    const price = parseFloat(saleData.selling_price_per_cup) || 0;
    const total_revenue = calculateTotalRevenue(cups, price);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('sales')
        .update({
          location_id: saleData.location_id,
          date: saleData.date,
          cups_sold: cups,
          selling_price_per_cup: price,
          total_revenue,
          notes: saleData.notes,
        })
        .eq('id', id)
        .select('*, locations(name)')
        .single();
      if (error) throw error;
      return {
        ...data,
        location_name: data.locations?.name || saleData.location_name,
      };
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.map((sale) =>
      sale.id === id
        ? {
            ...sale,
            location_id: saleData.location_id,
            location_name: saleData.location_name || sale.location_name,
            date: saleData.date,
            cups_sold: cups,
            selling_price_per_cup: price,
            total_revenue,
            notes: saleData.notes,
          }
        : sale
    );
    setStoredData(STORAGE_KEY, updated);
    return updated.find((s) => s.id === id);
  },

  async deleteSale(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.filter((sale) => sale.id !== id);
    setStoredData(STORAGE_KEY, updated);
    return true;
  },
};
