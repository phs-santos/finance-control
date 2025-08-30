import { useEffect } from 'react';
import { FinancialSummary } from '@/components/dashboard/FinancialSummary';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCategoryStore } from '@/store/useCategoryStore';

const Dashboard = () => {
  const { fetchTransactions, getSummary, getMonthlyData, isLoading } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();
  
  const summary = getSummary();
  const monthlyData = getMonthlyData();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
        <div className="text-sm text-muted-foreground">
          Visão geral das suas finanças
        </div>
      </div>
      
      <FinancialSummary summary={summary} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={monthlyData} />
        <CategoryBreakdown 
          incomeByCategory={summary.incomeByCategory}
          expensesByCategory={summary.expensesByCategory}
        />
      </div>
    </div>
  );
};

export default Dashboard;