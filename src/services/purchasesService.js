import { supabase, isSupabaseConfigured, getInitialData, setStoredData } from './dataStore';
import { calculateTotalPurchase } from '../utils/calculations';

const STORAGE_KEY = 'purchases';

export const purchasesService = {
  async getPurchases() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('purchases')
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

  async addPurchase(purchaseData) {
    const cups = parseInt(purchaseData.cups_purchased, 10) || 0;
    const price = parseFloat(purchaseData.purchase_price_per_cup) || 0;
    const total_amount = calculateTotalPurchase(cups, price);

    const record = {
      location_id: purchaseData.location_id || null,
      location_name: purchaseData.location_name || 'Unassigned',
      vendor_name: purchaseData.vendor_name || 'Vendor',
      date: purchaseData.date || new Date().toISOString().split('T')[0],
      cups_purchased: cups,
      purchase_price_per_cup: price,
      total_amount,
      notes: purchaseData.notes || '',
      created_by: purchaseData.created_by || 'Admin',
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('purchases')
        .insert([{
          location_id: record.location_id,
          vendor_name: record.vendor_name,
          date: record.date,
          cups_purchased: record.cups_purchased,
          purchase_price_per_cup: record.purchase_price_per_cup,
          total_amount: record.total_amount,
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
    const newPurchase = {
      id: 'pur_' + Date.now() + Math.random().toString(36).substr(2, 4),
      ...record,
      created_at: new Date().toISOString(),
    };
    const updated = [newPurchase, ...current];
    setStoredData(STORAGE_KEY, updated);
    return newPurchase;
  },

  async updatePurchase(id, purchaseData) {
    const cups = parseInt(purchaseData.cups_purchased, 10) || 0;
    const price = parseFloat(purchaseData.purchase_price_per_cup) || 0;
    const total_amount = calculateTotalPurchase(cups, price);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('purchases')
        .update({
          location_id: purchaseData.location_id,
          vendor_name: purchaseData.vendor_name,
          date: purchaseData.date,
          cups_purchased: cups,
          purchase_price_per_cup: price,
          total_amount,
          notes: purchaseData.notes,
        })
        .eq('id', id)
        .select('*, locations(name)')
        .single();
      if (error) throw error;
      return {
        ...data,
        location_name: data.locations?.name || purchaseData.location_name,
      };
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.map((p) =>
      p.id === id
        ? {
            ...p,
            location_id: purchaseData.location_id,
            location_name: purchaseData.location_name || p.location_name,
            vendor_name: purchaseData.vendor_name,
            date: purchaseData.date,
            cups_purchased: cups,
            purchase_price_per_cup: price,
            total_amount,
            notes: purchaseData.notes,
          }
        : p
    );
    setStoredData(STORAGE_KEY, updated);
    return updated.find((p) => p.id === id);
  },

  async deletePurchase(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.filter((p) => p.id !== id);
    setStoredData(STORAGE_KEY, updated);
    return true;
  },
};
