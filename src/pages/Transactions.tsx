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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <div className="text-sm text-muted-foreground">
          {recentTransactions.length} transações
        </div>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList 
              transactions={recentTransactions}
              onEdit={handleEditTransaction}
              onUpdate={refreshData}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transações Automáticas</CardTitle>
          </CardHeader>
          <CardContent>
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