import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Transaction } from '@/types';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  // Extract the current tab from the pathname
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    return path.substring(1); // Remove the leading '/'
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${tab}`);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setShowTransactionForm(true);
  };

  const handleFormSuccess = () => {
    setShowTransactionForm(false);
    // Force a page refresh to update data
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeTab={getCurrentTab()}
        onTabChange={handleTabChange}
        onAddTransaction={handleAddTransaction}
      />
      
      {/* Main Content */}
      <div className="md:ml-64 min-h-screen">
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSuccess={handleFormSuccess}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default Layout;