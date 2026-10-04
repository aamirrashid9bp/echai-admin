import { supabase, isSupabaseConfigured, getInitialData, setStoredData } from './dataStore';

const STORAGE_KEY = 'invoices';

export const generateInvoiceNumber = () => {
  const d = new Date();
  const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ECH-${yearMonth}-${randomSuffix}`;
};

export const invoicesService = {
  async getInvoices() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, locations(name), invoice_items(*)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((item) => ({
        ...item,
        location_name: item.locations?.name || 'Unassigned',
        items: item.invoice_items || [],
      }));
    }
    return getInitialData(STORAGE_KEY, []);
  },

  async getInvoiceById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, locations(name), invoice_items(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return {
        ...data,
        location_name: data.locations?.name || 'Unassigned',
        items: data.invoice_items || [],
      };
    }
    const invoices = getInitialData(STORAGE_KEY, []);
    return invoices.find((inv) => inv.id === id) || null;
  },

  async createInvoice(invoiceData, itemsData = []) {
    const items = itemsData.map((it) => {
      const qty = parseInt(it.quantity, 10) || 1;
      const price = parseFloat(it.price) || 0;
      return {
        description: it.description || 'Chai Supply',
        quantity: qty,
        price,
        total: qty * price,
      };
    });

    const subtotal = items.reduce((sum, it) => sum + it.total, 0);
    const tax = parseFloat(invoiceData.tax) || 0;
    const discount = parseFloat(invoiceData.discount) || 0;
    const total = Math.max(0, subtotal + tax - discount);
    const invoice_number = invoiceData.invoice_number || generateInvoiceNumber();

    if (isSupabaseConfigured) {
      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert([{
          invoice_number,
          location_id: invoiceData.location_id || null,
          date: invoiceData.date || new Date().toISOString().split('T')[0],
          customer_name: invoiceData.customer_name || 'Valued Customer',
          subtotal,
          tax,
          discount,
          total,
          status: invoiceData.status || 'Paid',
          notes: invoiceData.notes || '',
          created_by: invoiceData.created_by || 'Admin',
        }])
        .select()
        .single();
      if (invError) throw invError;

      if (items.length > 0) {
        const itemsToInsert = items.map((it) => ({
          invoice_id: inv.id,
          description: it.description,
          quantity: it.quantity,
          price: it.price,
          total: it.total,
        }));
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      return {
        ...inv,
        location_name: invoiceData.location_name || 'Unassigned',
        items,
      };
    }

    const current = getInitialData(STORAGE_KEY, []);
    const newInvoice = {
      id: 'invc_' + Date.now() + Math.random().toString(36).substr(2, 4),
      invoice_number,
      location_id: invoiceData.location_id || null,
      location_name: invoiceData.location_name || 'Unassigned',
      date: invoiceData.date || new Date().toISOString().split('T')[0],
      customer_name: invoiceData.customer_name || 'Valued Customer',
      subtotal,
      tax,
      discount,
      total,
      status: invoiceData.status || 'Paid',
      notes: invoiceData.notes || '',
      created_by: invoiceData.created_by || 'Admin',
      items,
      created_at: new Date().toISOString(),
    };

    const updated = [newInvoice, ...current];
    setStoredData(STORAGE_KEY, updated);
    return newInvoice;
  },

  async deleteInvoice(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.filter((inv) => inv.id !== id);
    setStoredData(STORAGE_KEY, updated);
    return true;
  },
};
