import { create } from 'zustand';
import { Category } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Selectors
  getById: (id: string) => Category | undefined;
  getByType: (type: 'income' | 'expense') => Category[];
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ categories: (data as Category[]) || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      const { categories } = get();
      set({ 
        categories: [...categories, data as Category].sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateCategory: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const { categories } = get();
      set({ 
        categories: categories.map(c => c.id === id ? data as Category : c)
          .sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const { categories } = get();
      set({ 
        categories: categories.filter(c => c.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  getById: (id) => {
    const { categories } = get();
    return categories.find(c => c.id === id);
  },

  getByType: (type) => {
    const { categories } = get();
    return categories.filter(c => c.type === type || c.type === 'both');
  },
}));