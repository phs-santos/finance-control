export interface Transaction {
  id: string;
  user_id?: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  created_at?: string;
  updated_at?: string;
  // Campos para transações recorrentes/parceladas
  is_recurring?: boolean;
  is_installment?: boolean;
  installment_count?: number;
  installment_number?: number;
  parent_transaction_id?: string;
  recurring_type?: 'weekly' | 'monthly' | 'yearly';
  recurring_until?: string;
  next_occurrence?: string;
}

export interface RecurringTransaction {
  id: string;
  user_id?: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  recurring_type: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InstallmentPlan {
  id: string;
  user_id?: string;
  category_id: string;
  type: 'income' | 'expense';
  total_amount: number;
  description: string;
  installment_count: number;
  start_date: string;
  installment_amount: number;
  completed_installments: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface ModuleConfig {
  id: string;
  user_id?: string;
  module_id: string;
  name: string;
  enabled: boolean;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

export interface Goal {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: 'savings' | 'purchase' | 'travel' | 'education' | 'emergency' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface GoalContribution {
  id: string;
  user_id?: string;
  goal_id: string;
  amount: number;
  description: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}