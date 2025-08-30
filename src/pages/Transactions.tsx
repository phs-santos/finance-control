import { useState, useEffect } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { Transaction } from '@/types';

const Transactions = () => {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  
  const { transactions, fetchTransactions, isLoading } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();
  
  const recentTransactions = transactions.slice(0, 10);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  const refreshData = () => {
    // No need to trigger refresh since store handles real-time updates
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
        <h1 className="text-2xl font-bold">Histórico de Transações</h1>
        <div className="text-sm text-muted-foreground">
          {recentTransactions.length} transações
        </div>
      </div>
      
      <TransactionList 
        transactions={recentTransactions}
        onEdit={handleEditTransaction}
        onUpdate={refreshData}
      />

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSuccess={handleFormSuccess}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;