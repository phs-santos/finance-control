import { useState } from 'react';
import { Plus, X, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useToast } from '@/hooks/use-toast';

interface TransactionFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	transaction?: Transaction;
	onOpenRecurring?: () => void;
}

export const TransactionForm = ({ isOpen, onClose, onSuccess, transaction, onOpenRecurring }: TransactionFormProps) => {
	const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
	const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
	const [description, setDescription] = useState(transaction?.description || '');
	const [category, setCategory] = useState(transaction?.category_id || '');
	const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { toast } = useToast();
	const { getByType } = useCategoryStore();
	const { createTransaction, updateTransaction } = useTransactionStore();
	const categories = getByType(type);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!amount || !description || !category) {
			toast({
				title: "Erro",
				description: "Preencha todos os campos obrigatórios",
				variant: "destructive"
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const transactionData = {
				type,
				amount: parseFloat(amount),
				description,
				category_id: category,
				date,
			};

			if (transaction) {
				await updateTransaction(transaction.id, transactionData);
				toast({
					title: "Sucesso",
					description: "Transação atualizada com sucesso!"
				});
			} else {
				await createTransaction(transactionData);
				toast({
					title: "Sucesso",
					description: "Transação criada com sucesso!"
				});
			}

			onSuccess();
			onClose();
			resetForm();
		} catch (error) {
			toast({
				title: "Erro",
				description: "Falha ao salvar a transação",
				variant: "destructive"
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setType('expense');
		setAmount('');
		setDescription('');
		setCategory('');
		setDate(new Date().toISOString().split('T')[0]);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-semibold">
						{transaction ? 'Editar Transação' : 'Nova Transação'}
					</CardTitle>
					<div className="flex gap-2">
						{!transaction && onOpenRecurring && (
							<Button variant="outline" size="icon" onClick={onOpenRecurring} title="Transações Automáticas">
								<Repeat className="h-4 w-4" />
							</Button>
						)}
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Type Selection */}
						<div className="space-y-2">
							<Label>Tipo</Label>
							<div className="flex gap-2">
								<Button
									type="button"
									variant={type === 'income' ? 'income' : 'outline'}
									size="sm"
									onClick={() => {
										setType('income');
										setCategory('');
									}}
									className="flex-1"
								>
									Receita
								</Button>
								<Button
									type="button"
									variant={type === 'expense' ? 'expense' : 'outline'}
									size="sm"
									onClick={() => {
										setType('expense');
										setCategory('');
									}}
									className="flex-1"
								>
									Despesa
								</Button>
							</div>
						</div>

						{/* Amount */}
						<div className="space-y-2">
							<Label htmlFor="amount">Valor *</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								placeholder="0,00"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								required
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor="description">Descrição *</Label>
							<Textarea
								id="description"
								placeholder="Descreva a transação..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								required
								rows={3}
							/>
						</div>

						{/* Category */}
						<div className="space-y-2">
							<Label>Categoria *</Label>
							<Select value={category} onValueChange={setCategory} required>
								<SelectTrigger>
									<SelectValue placeholder="Selecione uma categoria" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((cat) => (
										<SelectItem key={cat.id} value={cat.id}>
											<div className="flex items-center gap-2">
												<span>{cat.icon}</span>
												<span>{cat.name}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Date */}
						<div className="space-y-2">
							<Label htmlFor="date">Data</Label>
							<Input
								id="date"
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								required
							/>
						</div>

						{/* Actions */}
						<div className="flex gap-2 pt-4">
							<Button type="button" variant="outline" onClick={onClose} className="flex-1">
								Cancelar
							</Button>
							<Button
								type="submit"
								variant="gradient"
								disabled={isSubmitting}
								className="flex-1"
							>
								{isSubmitting ? 'Salvando...' : (transaction ? 'Atualizar' : 'Criar')}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};