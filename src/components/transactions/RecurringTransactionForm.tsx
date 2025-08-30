import { useState } from 'react';
import { Plus, X, Repeat, Calendar, CreditCard, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecurringTransaction, InstallmentPlan } from '@/types';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useRecurringTransactionStore } from '@/store/useRecurringTransactionStore';
import { useInstallmentPlanStore } from '@/store/useInstallmentPlanStore';
import { useToast } from '@/hooks/use-toast';

interface RecurringTransactionFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export const RecurringTransactionForm = ({ isOpen, onClose, onSuccess }: RecurringTransactionFormProps) => {
	const [activeTab, setActiveTab] = useState<'recurring' | 'installment'>('recurring');

	// Estados para transação recorrente
	const [recurringType, setRecurringType] = useState<'income' | 'expense'>('expense');
	const [recurringAmount, setRecurringAmount] = useState('');
	const [recurringDescription, setRecurringDescription] = useState('');
	const [recurringCategory, setRecurringCategory] = useState('');
	const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
	const [recurringStartDate, setRecurringStartDate] = useState(new Date().toISOString().split('T')[0]);
	const [recurringEndDate, setRecurringEndDate] = useState('');
	const [recurringPaymentMethod, setRecurringPaymentMethod] = useState<'card' | 'pix' | 'bank_transfer' | 'cash' | 'other'>('pix');
	const [recurringPaymentDate, setRecurringPaymentDate] = useState('5');
	const [recurringNotes, setRecurringNotes] = useState('');

	// Estados para parcelamento
	const [installmentType, setInstallmentType] = useState<'income' | 'expense'>('expense');
	const [installmentTotalAmount, setInstallmentTotalAmount] = useState('');
	const [installmentDescription, setInstallmentDescription] = useState('');
	const [installmentCategory, setInstallmentCategory] = useState('');
	const [installmentCount, setInstallmentCount] = useState('');
	const [installmentStartDate, setInstallmentStartDate] = useState(new Date().toISOString().split('T')[0]);
	const [installmentPaymentMethod, setInstallmentPaymentMethod] = useState<'card' | 'pix' | 'bank_transfer' | 'cash' | 'other'>('card');
	const [installmentPaymentDate, setInstallmentPaymentDate] = useState('5');
	const [installmentNotes, setInstallmentNotes] = useState('');

	const [isSubmitting, setIsSubmitting] = useState(false);

	const { toast } = useToast();
	const { getByType } = useCategoryStore();
	const { createRecurringTransaction } = useRecurringTransactionStore();
	const { createInstallmentPlan } = useInstallmentPlanStore();

	const recurringCategories = getByType(recurringType);
	const installmentCategories = getByType(installmentType);

	const handleRecurringSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!recurringAmount || !recurringDescription || !recurringCategory) {
			toast({
				title: "Erro",
				description: "Preencha todos os campos obrigatórios",
				variant: "destructive"
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const nextOccurrence = new Date(recurringStartDate);
			switch (recurringFrequency) {
				case 'weekly':
					nextOccurrence.setDate(nextOccurrence.getDate() + 7);
					break;
				case 'monthly':
					nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
					break;
				case 'yearly':
					nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
					break;
			}

			await createRecurringTransaction({
				type: recurringType,
				amount: parseFloat(recurringAmount),
				description: recurringDescription,
				category_id: recurringCategory,
				recurring_type: recurringFrequency,
				start_date: recurringStartDate,
				end_date: recurringEndDate || undefined,
				next_occurrence: nextOccurrence.toISOString().split('T')[0],
				is_active: true,
				payment_method: recurringPaymentMethod,
				payment_date: parseInt(recurringPaymentDate),
				notes: recurringNotes || undefined,
			});

			toast({
				title: "Sucesso",
				description: "Transação recorrente criada com sucesso!"
			});

			onSuccess();
			onClose();
			resetForms();
		} catch (error) {
			toast({
				title: "Erro",
				description: "Falha ao criar transação recorrente",
				variant: "destructive"
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleInstallmentSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!installmentTotalAmount || !installmentDescription || !installmentCategory || !installmentCount) {
			toast({
				title: "Erro",
				description: "Preencha todos os campos obrigatórios",
				variant: "destructive"
			});
			return;
		}

		if (parseInt(installmentCount) < 2) {
			toast({
				title: "Erro",
				description: "O número de parcelas deve ser maior que 1",
				variant: "destructive"
			});
			return;
		}

		setIsSubmitting(true);

		try {
			await createInstallmentPlan({
				type: installmentType,
				total_amount: parseFloat(installmentTotalAmount),
				description: installmentDescription,
				category_id: installmentCategory,
				installment_count: parseInt(installmentCount),
				start_date: installmentStartDate,
				installment_amount: 0, // Será calculado automaticamente
				completed_installments: 0,
				is_active: true,
				payment_method: installmentPaymentMethod,
				payment_date: parseInt(installmentPaymentDate),
				notes: installmentNotes || undefined,
			});

			toast({
				title: "Sucesso",
				description: "Parcelamento criado com sucesso!"
			});

			onSuccess();
			onClose();
			resetForms();
		} catch (error) {
			toast({
				title: "Erro",
				description: "Falha ao criar parcelamento",
				variant: "destructive"
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForms = () => {
		// Reset recurring form
		setRecurringType('expense');
		setRecurringAmount('');
		setRecurringDescription('');
		setRecurringCategory('');
		setRecurringFrequency('monthly');
		setRecurringStartDate(new Date().toISOString().split('T')[0]);
		setRecurringEndDate('');
		setRecurringPaymentMethod('pix');
		setRecurringPaymentDate('5');
		setRecurringNotes('');

		// Reset installment form
		setInstallmentType('expense');
		setInstallmentTotalAmount('');
		setInstallmentDescription('');
		setInstallmentCategory('');
		setInstallmentCount('');
		setInstallmentStartDate(new Date().toISOString().split('T')[0]);
		setInstallmentPaymentMethod('card');
		setInstallmentPaymentDate('5');
		setInstallmentNotes('');
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<Card className="w-full max-w-lg max-h-[95vh] overflow-y-auto">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sticky top-0 bg-card z-10">
					<CardTitle className="text-lg font-semibold">
						Transações Automáticas
					</CardTitle>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				</CardHeader>

				<CardContent className="p-4 md:p-6">
					<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'recurring' | 'installment')}>
						<TabsList className="grid w-full grid-cols-2 mb-4 h-auto p-1">
							<TabsTrigger value="recurring" className="flex items-center gap-2 text-xs sm:text-sm p-2">
								<Repeat className="h-4 w-4" />
								<span className="hidden sm:inline">Recorrente</span>
								<span className="sm:hidden">Recor.</span>
							</TabsTrigger>
							<TabsTrigger value="installment" className="flex items-center gap-2 text-xs sm:text-sm p-2">
								<Calendar className="h-4 w-4" />
								<span className="hidden sm:inline">Parcelado</span>
								<span className="sm:hidden">Parc.</span>
							</TabsTrigger>
						</TabsList>

						<TabsContent value="recurring">
							<form onSubmit={handleRecurringSubmit} className="space-y-4">
								{/* Type Selection */}
								<div className="space-y-2">
									<Label className="text-sm font-medium">Tipo</Label>
									<div className="grid grid-cols-2 gap-2">
										<Button
											type="button"
											variant={recurringType === 'income' ? 'income' : 'outline'}
											size="sm"
											onClick={() => {
												setRecurringType('income');
												setRecurringCategory('');
											}}
											className="h-10"
										>
											Receita
										</Button>
										<Button
											type="button"
											variant={recurringType === 'expense' ? 'expense' : 'outline'}
											size="sm"
											onClick={() => {
												setRecurringType('expense');
												setRecurringCategory('');
											}}
											className="h-10"
										>
											Despesa
										</Button>
									</div>
								</div>

								{/* Amount */}
								<div className="space-y-2">
									<Label htmlFor="recurring-amount">Valor *</Label>
									<Input
										id="recurring-amount"
										type="number"
										step="0.01"
										placeholder="0,00"
										value={recurringAmount}
										onChange={(e) => setRecurringAmount(e.target.value)}
										required
									/>
								</div>

								{/* Description */}
								<div className="space-y-2">
									<Label htmlFor="recurring-description">Descrição *</Label>
									<Textarea
										id="recurring-description"
										placeholder="Ex: Salário, Aluguel..."
										value={recurringDescription}
										onChange={(e) => setRecurringDescription(e.target.value)}
										required
										rows={2}
									/>
								</div>

								{/* Category */}
								<div className="space-y-2">
									<Label>Categoria *</Label>
									<Select value={recurringCategory} onValueChange={setRecurringCategory} required>
										<SelectTrigger>
											<SelectValue placeholder="Selecione uma categoria" />
										</SelectTrigger>
										<SelectContent>
											{recurringCategories.map((cat) => (
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

								{/* Frequency */}
								<div className="space-y-2">
									<Label>Frequência</Label>
									<Select value={recurringFrequency} onValueChange={(value) => setRecurringFrequency(value as 'weekly' | 'monthly' | 'yearly')}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="weekly">Semanal</SelectItem>
											<SelectItem value="monthly">Mensal</SelectItem>
											<SelectItem value="yearly">Anual</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Start Date */}
								<div className="space-y-2">
									<Label htmlFor="recurring-start-date">Data de Início</Label>
									<Input
										id="recurring-start-date"
										type="date"
										value={recurringStartDate}
										onChange={(e) => setRecurringStartDate(e.target.value)}
										required
									/>
								</div>

								{/* End Date */}
								<div className="space-y-2">
									<Label htmlFor="recurring-end-date">Data de Fim (opcional)</Label>
									<Input
										id="recurring-end-date"
										type="date"
										value={recurringEndDate}
										onChange={(e) => setRecurringEndDate(e.target.value)}
									/>
								</div>

								{/* Payment Information */}
								<div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
									<div className="flex items-center gap-2">
										<CreditCard className="h-4 w-4 text-primary" />
										<Label className="text-sm font-medium">Informações de Pagamento</Label>
									</div>
									
									{/* Payment Method */}
									<div className="space-y-2">
										<Label>Método de Pagamento</Label>
										<Select value={recurringPaymentMethod} onValueChange={(value) => setRecurringPaymentMethod(value as any)}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="pix">PIX</SelectItem>
												<SelectItem value="card">Cartão</SelectItem>
												<SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
												<SelectItem value="cash">Dinheiro</SelectItem>
												<SelectItem value="other">Outro</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Payment Date */}
									<div className="space-y-2">
										<Label htmlFor="recurring-payment-date">Dia do Pagamento</Label>
										<Select value={recurringPaymentDate} onValueChange={setRecurringPaymentDate}>
											<SelectTrigger>
												<SelectValue placeholder="Dia do mês" />
											</SelectTrigger>
											<SelectContent>
												{Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
													<SelectItem key={day} value={day.toString()}>
														Dia {day}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* Notes */}
									<div className="space-y-2">
										<Label htmlFor="recurring-notes">Observações (opcional)</Label>
										<Textarea
											id="recurring-notes"
											placeholder="Ex: Débito automático, cartão terminado em 1234..."
											value={recurringNotes}
											onChange={(e) => setRecurringNotes(e.target.value)}
											rows={2}
										/>
									</div>
								</div>

								{/* Actions */}
								<div className="grid grid-cols-2 gap-3 pt-4">
									<Button type="button" variant="outline" onClick={onClose}>
										Cancelar
									</Button>
									<Button
										type="submit"
										variant="gradient"
										disabled={isSubmitting}
									>
										{isSubmitting ? 'Criando...' : 'Criar'}
									</Button>
								</div>
							</form>
						</TabsContent>

						<TabsContent value="installment">
							<form onSubmit={handleInstallmentSubmit} className="space-y-4">
								{/* Type Selection */}
								<div className="space-y-2">
									<Label className="text-sm font-medium">Tipo</Label>
									<div className="grid grid-cols-2 gap-2">
										<Button
											type="button"
											variant={installmentType === 'income' ? 'income' : 'outline'}
											size="sm"
											onClick={() => {
												setInstallmentType('income');
												setInstallmentCategory('');
											}}
											className="h-10"
										>
											Receita
										</Button>
										<Button
											type="button"
											variant={installmentType === 'expense' ? 'expense' : 'outline'}
											size="sm"
											onClick={() => {
												setInstallmentType('expense');
												setInstallmentCategory('');
											}}
											className="h-10"
										>
											Despesa
										</Button>
									</div>
								</div>

								{/* Total Amount */}
								<div className="space-y-2">
									<Label htmlFor="installment-total-amount">Valor Total *</Label>
									<Input
										id="installment-total-amount"
										type="number"
										step="0.01"
										placeholder="0,00"
										value={installmentTotalAmount}
										onChange={(e) => setInstallmentTotalAmount(e.target.value)}
										required
									/>
								</div>

								{/* Installment Count */}
								<div className="space-y-2">
									<Label htmlFor="installment-count">Número de Parcelas *</Label>
									<Input
										id="installment-count"
										type="number"
										min="2"
										placeholder="12"
										value={installmentCount}
										onChange={(e) => setInstallmentCount(e.target.value)}
										required
									/>
									{installmentCount && installmentTotalAmount && (
										<p className="text-sm text-muted-foreground">
											Valor por parcela: R$ {(parseFloat(installmentTotalAmount) / parseInt(installmentCount)).toFixed(2)}
										</p>
									)}
								</div>

								{/* Description */}
								<div className="space-y-2">
									<Label htmlFor="installment-description">Descrição *</Label>
									<Textarea
										id="installment-description"
										placeholder="Ex: Financiamento do carro, Viagem..."
										value={installmentDescription}
										onChange={(e) => setInstallmentDescription(e.target.value)}
										required
										rows={2}
									/>
								</div>

								{/* Category */}
								<div className="space-y-2">
									<Label>Categoria *</Label>
									<Select value={installmentCategory} onValueChange={setInstallmentCategory} required>
										<SelectTrigger>
											<SelectValue placeholder="Selecione uma categoria" />
										</SelectTrigger>
										<SelectContent>
											{installmentCategories.map((cat) => (
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

								{/* Start Date */}
								<div className="space-y-2">
									<Label htmlFor="installment-start-date">Data da Primeira Parcela</Label>
									<Input
										id="installment-start-date"
										type="date"
										value={installmentStartDate}
										onChange={(e) => setInstallmentStartDate(e.target.value)}
										required
									/>
								</div>

								{/* Payment Information */}
								<div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
									<div className="flex items-center gap-2">
										<CreditCard className="h-4 w-4 text-primary" />
										<Label className="text-sm font-medium">Informações de Pagamento</Label>
									</div>
									
									{/* Payment Method */}
									<div className="space-y-2">
										<Label>Método de Pagamento</Label>
										<Select value={installmentPaymentMethod} onValueChange={(value) => setInstallmentPaymentMethod(value as any)}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="card">Cartão de Crédito</SelectItem>
												<SelectItem value="pix">PIX</SelectItem>
												<SelectItem value="bank_transfer">Financiamento</SelectItem>
												<SelectItem value="cash">Dinheiro</SelectItem>
												<SelectItem value="other">Outro</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Payment Date */}
									<div className="space-y-2">
										<Label htmlFor="installment-payment-date">Dia do Vencimento</Label>
										<Select value={installmentPaymentDate} onValueChange={setInstallmentPaymentDate}>
											<SelectTrigger>
												<SelectValue placeholder="Dia do mês" />
											</SelectTrigger>
											<SelectContent>
												{Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
													<SelectItem key={day} value={day.toString()}>
														Dia {day}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* Notes */}
									<div className="space-y-2">
										<Label htmlFor="installment-notes">Observações (opcional)</Label>
										<Textarea
											id="installment-notes"
											placeholder="Ex: Cartão terminado em 1234, taxa de juros..."
											value={installmentNotes}
											onChange={(e) => setInstallmentNotes(e.target.value)}
											rows={2}
										/>
									</div>
								</div>

								{/* Actions */}
								<div className="grid grid-cols-2 gap-3 pt-4">
									<Button type="button" variant="outline" onClick={onClose}>
										Cancelar
									</Button>
									<Button
										type="submit"
										variant="gradient"
										disabled={isSubmitting}
									>
										{isSubmitting ? 'Criando...' : 'Criar'}
									</Button>
								</div>
							</form>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};