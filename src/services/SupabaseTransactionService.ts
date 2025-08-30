import { Transaction, FinancialSummary, MonthlyData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

class SupabaseTransactionService {
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions' as any)
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    return (data as unknown as Transaction[]) || [];
  }

  async getById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }

    return data as unknown as Transaction;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions' as any)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions by date range:', error);
      throw error;
    }

    return (data as unknown as Transaction[]) || [];
  }

  async getByCategory(categoryId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions' as any)
      .select('*')
      .eq('category_id', categoryId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions by category:', error);
      throw error;
    }

    return (data as unknown as Transaction[]) || [];
  }

  async create(transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions' as any)
      .insert([{
        ...transaction,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    return data as unknown as Transaction;
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }

    return data as unknown as Transaction;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('transactions' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }

    return true;
  }

  async getSummary(): Promise<FinancialSummary> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Usar a função SQL criada anteriormente
    const { data, error } = await supabase
      .rpc('get_financial_summary' as any, { user_uuid: user.id });

    if (error) {
      console.error('Error fetching financial summary:', error);
      
      // Fallback para implementação manual se a função não existir
      const transactions = await this.getAll();
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        incomeByCategory: {},
        expensesByCategory: {}
      };
    }

    const result = data[0];
    return {
      totalIncome: Number(result.total_income),
      totalExpenses: Number(result.total_expenses),
      balance: Number(result.balance),
      incomeByCategory: result.income_by_category || {},
      expensesByCategory: result.expenses_by_category || {}
    };
  }

  async getMonthlyData(months: number = 6): Promise<MonthlyData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Usar a função SQL criada anteriormente
    const { data, error } = await supabase
      .rpc('get_monthly_data' as any, { 
        user_uuid: user.id,
        months_count: months 
      });

    if (error) {
      console.error('Error fetching monthly data:', error);
      
      // Fallback para implementação manual se a função não existir
      const transactions = await this.getAll();
      const monthlyData: Record<string, MonthlyData> = {};
      const now = new Date();

      // Initialize last N months
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        
        monthlyData[monthKey] = {
          month: monthName,
          income: 0,
          expense: 0,
          balance: 0,
        };
      }

      // Aggregate transactions by month
      transactions.forEach(transaction => {
        const monthKey = transaction.date.slice(0, 7);
        if (monthlyData[monthKey]) {
          if (transaction.type === 'income') {
            monthlyData[monthKey].income += transaction.amount;
          } else {
            monthlyData[monthKey].expense += transaction.amount;
          }
        }
      });

      // Calculate balance for each month
      Object.values(monthlyData).forEach(data => {
        data.balance = data.income - data.expense;
      });

      return Object.values(monthlyData);
    }

    return data.map((item: any) => ({
      month: item.month_name,
      income: Number(item.income),
      expense: Number(item.expense),
      balance: Number(item.balance)
    }));
  }
}

export const supabaseTransactionService = new SupabaseTransactionService();