import { useState, useEffect } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { RecurringTransactionForm } from '@/components/transactions/RecurringTransactionForm';
import { RecurringTransactionList } from '@/components/transactions/RecurringTransactionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useRecurringTransactionStore } from '@/store/useRecurringTransactionStore';
import { useInstallmentPlanStore } from '@/store/useInstallmentPlanStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { Transaction } from '@/types';

const Transactions = () => {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchRecurringTransactions } = useRecurringTransactionStore();
  const { fetchInstallmentPlans } = useInstallmentPlanStore();
  
  const recentTransactions = transactions.slice(0, 10);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchRecurringTransactions();
    fetchInstallmentPlans();
  }, [fetchTransactions, fetchCategories, fetchRecurringTransactions, fetchInstallmentPlans]);

  const refreshData = () => {
    fetchTransactions();
    fetchRecurringTransactions();
    fetchInstallmentPlans();
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleFormSuccess = () => {
    refreshData();
    setShowTransactionForm(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold">Transações</h1>
        <div className="text-sm text-muted-foreground">
          {recentTransactions.length} transações
        </div>
      </div>
      
      <div className="grid gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <TransactionList 
              transactions={recentTransactions}
              onEdit={handleEditTransaction}
              onUpdate={refreshData}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Transações Automáticas</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <RecurringTransactionList onUpdate={refreshData} />
          </CardContent>
        </Card>
      </div>

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSuccess={handleFormSuccess}
        transaction={editingTransaction}
        onOpenRecurring={() => {
          setShowTransactionForm(false);
          setShowRecurringForm(true);
        }}
      />

      <RecurringTransactionForm
        isOpen={showRecurringForm}
        onClose={() => setShowRecurringForm(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Transactions;