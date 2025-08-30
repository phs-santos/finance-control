import { create } from 'zustand';
import { Goal, GoalContribution } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface GoalStore {
  goals: Goal[];
  contributions: GoalContribution[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchGoals: () => Promise<void>;
  fetchContributions: () => Promise<void>;
  createGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_amount' | 'status' | 'completed_at'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addContribution: (goalId: string, amount: number, description: string) => Promise<void>;
  
  // Selectors
  getGoalProgress: (goalId: string) => {
    percentage: number;
    remaining: number;
    daysLeft: number;
  };
  getGoalSummary: () => {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    pausedGoals: number;
    totalValue: number;
    achievedValue: number;
    overallProgress: number;
  };
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  contributions: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ goals: (data as Goal[]) || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchContributions: async () => {
    try {
      const { data, error } = await supabase
        .from('goal_contributions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      set({ contributions: data || [] });
    } catch (error: any) {
      console.error('Error fetching contributions:', error);
    }
  },

  createGoal: async (goal) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('goals')
        .insert([{ ...goal, user_id: user.id, current_amount: 0, status: 'active' }])
        .select()
        .single();

      if (error) throw error;
      
      const { goals } = get();
      set({ 
        goals: [data as Goal, ...goals],
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateGoal: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const { goals } = get();
      set({ 
        goals: goals.map(g => g.id === id ? data as Goal : g),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteGoal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const { goals } = get();
      set({ 
        goals: goals.filter(g => g.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addContribution: async (goalId, amount, description) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('goal_contributions')
        .insert([{
          goal_id: goalId,
          user_id: user.id,
          amount,
          description,
          date: new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (error) throw error;
      
      const { contributions } = get();
      set({ 
        contributions: [data, ...contributions],
        isLoading: false 
      });
      
      // Refresh goals to update current_amount (handled by database trigger)
      get().fetchGoals();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  getGoalProgress: (goalId) => {
    const { goals } = get();
    const goal = goals.find(g => g.id === goalId);
    if (!goal || goal.target_amount === 0) {
      return { percentage: 0, remaining: 0, daysLeft: 0 };
    }
    
    const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const daysLeft = Math.max(Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
    
    return { percentage, remaining, daysLeft };
  },

  getGoalSummary: () => {
    const { goals } = get();
    const totalValue = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const achievedValue = goals.reduce((sum, g) => sum + g.current_amount, 0);
    
    return {
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      pausedGoals: goals.filter(g => g.status === 'paused').length,
      totalValue,
      achievedValue,
      overallProgress: totalValue > 0 ? (achievedValue / totalValue) * 100 : 0,
    };
  },
}));