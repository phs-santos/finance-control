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