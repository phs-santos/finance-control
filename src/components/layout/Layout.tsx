import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { RecurringTransactionForm } from '@/components/transactions/RecurringTransactionForm';
import { Transaction } from '@/types';

const Layout = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [showTransactionForm, setShowTransactionForm] = useState(false);
	const [showRecurringTransactionForm, setShowRecurringTransactionForm] = useState(false);
	
	const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
	const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<Transaction | undefined>();

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
		setEditingRecurringTransaction(undefined);
		setShowTransactionForm(true);
	};

	const handleAddRecurringTransaction = () => {
		setEditingTransaction(undefined);
		setShowRecurringTransactionForm(true);
	};

	const handleFormSuccess = () => {
		setShowTransactionForm(false);
		window.location.reload();
	};

	const handleFormRecurringTransactionSuccess = () => {
		setShowRecurringTransactionForm(false);
		window.location.reload();
	};

	return (
		<div className="min-h-screen bg-background">
			<Navigation 
				activeTab={getCurrentTab()} 
				onTabChange={handleTabChange} 
				onAddTransaction={handleAddTransaction} 
				onAddRecurringTransaction={handleAddRecurringTransaction}
			/>

			{/* Main Content */}
			<div className="md:ml-64 min-h-screen">
				<main className="px-4 py-2 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6">
					<Outlet />
				</main>
			</div>

			{/* Transaction Form Modal */}
			<RecurringTransactionForm 
				isOpen={showRecurringTransactionForm} 
				onClose={() => setShowRecurringTransactionForm(false)}
				onSuccess={handleFormSuccess}
			/>

			<TransactionForm 
				isOpen={showTransactionForm} 
				onClose={() => setShowTransactionForm(false)} 
				onSuccess={handleFormRecurringTransactionSuccess} 
				transaction={editingTransaction} 
			/>
		</div>
	);
};

export default Layout;