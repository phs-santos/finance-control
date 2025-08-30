import { create } from 'zustand';
import { InstallmentPlan } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface InstallmentPlanStore {
  installmentPlans: InstallmentPlan[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchInstallmentPlans: () => Promise<void>;
  createInstallmentPlan: (plan: Omit<InstallmentPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateInstallmentPlan: (id: string, updates: Partial<InstallmentPlan>) => Promise<void>;
  deleteInstallmentPlan: (id: string) => Promise<void>;
  generateNextInstallment: (planId: string) => Promise<void>;
}

export const useInstallmentPlanStore = create<InstallmentPlanStore>((set, get) => ({
  installmentPlans: [],
  isLoading: false,
  error: null,

  fetchInstallmentPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('installment_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ installmentPlans: (data as InstallmentPlan[]) || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createInstallmentPlan: async (plan) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const installmentAmount = plan.total_amount / plan.installment_count;
      
      const { data, error } = await supabase
        .from('installment_plans')
        .insert([{ 
          ...plan, 
          user_id: user.id,
          installment_amount: Math.round(installmentAmount * 100) / 100,
          completed_installments: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      const { installmentPlans } = get();
      set({ 
        installmentPlans: [data as InstallmentPlan, ...installmentPlans],
        isLoading: false 
      });

      // Gerar primeira parcela automaticamente
      get().generateNextInstallment(data.id);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateInstallmentPlan: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('installment_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const { installmentPlans } = get();
      set({ 
        installmentPlans: installmentPlans.map(p => p.id === id ? data as InstallmentPlan : p),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteInstallmentPlan: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('installment_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const { installmentPlans } = get();
      set({ 
        installmentPlans: installmentPlans.filter(p => p.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  generateNextInstallment: async (planId) => {
    try {
      const { installmentPlans } = get();
      const plan = installmentPlans.find(p => p.id === planId);
      
      if (!plan || !plan.is_active || plan.completed_installments >= plan.installment_count) {
        return;
      }

      const nextInstallmentNumber = plan.completed_installments + 1;
      const installmentDate = new Date(plan.start_date);
      installmentDate.setMonth(installmentDate.getMonth() + (nextInstallmentNumber - 1));

      // Criar a transação da parcela
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          category_id: plan.category_id,
          type: plan.type,
          amount: plan.installment_amount,
          description: `${plan.description} (${nextInstallmentNumber}/${plan.installment_count})`,
          date: installmentDate.toISOString().split('T')[0],
          is_installment: true,
          installment_count: plan.installment_count,
          installment_number: nextInstallmentNumber,
          parent_transaction_id: plan.id,
        }]);

      if (transactionError) throw transactionError;

      // Atualizar contador de parcelas completadas
      await get().updateInstallmentPlan(planId, {
        completed_installments: nextInstallmentNumber,
        is_active: nextInstallmentNumber < plan.installment_count
      });

    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));