import { create } from 'zustand';
import { RecurringTransaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface RecurringTransactionStore {
  recurringTransactions: RecurringTransaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRecurringTransactions: () => Promise<void>;
  createRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
}

export const useRecurringTransactionStore = create<RecurringTransactionStore>((set, get) => ({
  recurringTransactions: [],
  isLoading: false,
  error: null,

  fetchRecurringTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ recurringTransactions: (data as RecurringTransaction[]) || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createRecurringTransaction: async (transaction) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      const { recurringTransactions } = get();
      set({ 
        recurringTransactions: [data as RecurringTransaction, ...recurringTransactions],
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateRecurringTransaction: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const { recurringTransactions } = get();
      set({ 
        recurringTransactions: recurringTransactions.map(t => t.id === id ? data as RecurringTransaction : t),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteRecurringTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const { recurringTransactions } = get();
      set({ 
        recurringTransactions: recurringTransactions.filter(t => t.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));