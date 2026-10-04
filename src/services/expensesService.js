import { supabase, isSupabaseConfigured, getInitialData, setStoredData } from './dataStore';

const STORAGE_KEY = 'expenses';

export const EXPENSE_CATEGORIES = [
  'Chai Cost',
  'Cup Cost',
  'Tissue Cost',
  'Travelling / Transport',
  'Other Expenses',
];

export const expensesService = {
  async getExpenses() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
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

  async addExpense(expenseData) {
    const amount = parseFloat(expenseData.amount) || 0;

    const record = {
      location_id: expenseData.location_id || null,
      location_name: expenseData.location_name || 'Unassigned',
      date: expenseData.date || new Date().toISOString().split('T')[0],
      category: expenseData.category || 'Other Expenses',
      description: expenseData.description || '',
      amount,
      created_by: expenseData.created_by || 'Admin',
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          location_id: record.location_id,
          date: record.date,
          category: record.category,
          description: record.description,
          amount: record.amount,
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
    const newExpense = {
      id: 'exp_' + Date.now() + Math.random().toString(36).substr(2, 4),
      ...record,
      created_at: new Date().toISOString(),
    };
    const updated = [newExpense, ...current];
    setStoredData(STORAGE_KEY, updated);
    return newExpense;
  },

  async updateExpense(id, expenseData) {
    const amount = parseFloat(expenseData.amount) || 0;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          location_id: expenseData.location_id,
          date: expenseData.date,
          category: expenseData.category,
          description: expenseData.description,
          amount,
        })
        .eq('id', id)
        .select('*, locations(name)')
        .single();
      if (error) throw error;
      return {
        ...data,
        location_name: data.locations?.name || expenseData.location_name,
      };
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.map((exp) =>
      exp.id === id
        ? {
            ...exp,
            location_id: expenseData.location_id,
            location_name: expenseData.location_name || exp.location_name,
            date: expenseData.date,
            category: expenseData.category,
            description: expenseData.description,
            amount,
          }
        : exp
    );
    setStoredData(STORAGE_KEY, updated);
    return updated.find((e) => e.id === id);
  },

  async deleteExpense(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const current = getInitialData(STORAGE_KEY, []);
    const updated = current.filter((exp) => exp.id !== id);
    setStoredData(STORAGE_KEY, updated);
    return true;
  },
};
