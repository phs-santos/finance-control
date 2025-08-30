import { useState, useEffect } from 'react';
import { Edit2, Trash2, Repeat, Calendar, Play, Pause, Plus, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RecurringTransaction, InstallmentPlan } from '@/types';
import { useRecurringTransactionStore } from '@/store/useRecurringTransactionStore';
import { useInstallmentPlanStore } from '@/store/useInstallmentPlanStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { RecurringTransactionForm } from './RecurringTransactionForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecurringTransactionListProps {
  onUpdate: () => void;
}

export const RecurringTransactionList = ({ onUpdate }: RecurringTransactionListProps) => {
  const [activeTab, setActiveTab] = useState<'recurring' | 'installment'>('recurring');
  const [showForm, setShowForm] = useState(false);

  const { toast } = useToast();
  const { categories } = useCategoryStore();
  const { fetchTransactions } = useTransactionStore();
  const {
    recurringTransactions,
    fetchRecurringTransactions,
    updateRecurringTransaction,
    deleteRecurringTransaction
  } = useRecurringTransactionStore();
  const {
    installmentPlans,
    fetchInstallmentPlans,
    updateInstallmentPlan,
    deleteInstallmentPlan,
    generateNextInstallment
  } = useInstallmentPlanStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetchRecurringTransactions();
    fetchInstallmentPlans();
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : 'Categoria não encontrada';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      weekly: 'Semanal',
      monthly: 'Mensal',
      yearly: 'Anual',
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'card': return 'Cartão';
      case 'pix': return 'PIX';
      case 'bank_transfer': return 'Transferência';
      case 'cash': return 'Dinheiro';
      case 'other': return 'Outro';
      default: return 'Não informado';
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'card': return <CreditCard className="h-3 w-3" />;
      case 'pix': return <Calendar className="h-3 w-3" />;
      default: return <CreditCard className="h-3 w-3" />;
    }
  };

  const handleToggleRecurring = async (id: string, isActive: boolean) => {
    await updateRecurringTransaction(id, { is_active: !isActive });
    toast({
      title: "Sucesso",
      description: `Transação recorrente ${!isActive ? 'ativada' : 'pausada'} com sucesso!`
    });
  };

  const handleToggleInstallment = async (id: string, isActive: boolean) => {
    await updateInstallmentPlan(id, { is_active: !isActive });
    toast({
      title: "Sucesso",
      description: `Parcelamento ${!isActive ? 'ativado' : 'pausado'} com sucesso!`
    });
  };

  const handleDeleteRecurring = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação recorrente?')) {
      await deleteRecurringTransaction(id);
      onUpdate();
      toast({
        title: "Sucesso",
        description: "Transação recorrente excluída com sucesso!"
      });
    }
  };

  const handleDeleteInstallment = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este parcelamento?')) {
      await deleteInstallmentPlan(id);
      onUpdate();
      toast({
        title: "Sucesso",
        description: "Parcelamento excluído com sucesso!"
      });
    }
  };

  const handleGenerateInstallment = async (planId: string) => {
    await generateNextInstallment(planId);
    onUpdate();
    toast({
      title: "Sucesso",
      description: "Próxima parcela gerada com sucesso!"
    });
  };

  const processAutomaticTransactions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-automatic-transactions');
      
      if (error) throw error;
      
      if (data.generated_count > 0) {
        fetchTransactions();
        onUpdate();
        toast({
          title: "Processamento Concluído",
          description: `${data.generated_count} transações automáticas foram processadas!`
        });
      } else {
        toast({
          title: "Processamento Concluído",
          description: "Nenhuma transação automática pendente encontrada"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao processar transações automáticas",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base md:text-lg font-semibold">Transações Automáticas</h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowForm(true)}
            variant="gradient"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova
          </Button>
          <Button 
            onClick={processAutomaticTransactions}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Processar
          </Button>
        </div>
      </div>

      <Alert className="text-sm">
        <AlertDescription>
          As transações são processadas automaticamente. Use "Processar" para forçar.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'recurring' | 'installment')}>
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="recurring" className="flex items-center gap-2 text-xs sm:text-sm p-2">
            <Repeat className="h-4 w-4" />
            <span className="hidden sm:inline">Recorrentes ({recurringTransactions.length})</span>
            <span className="sm:hidden">Rec. ({recurringTransactions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="installment" className="flex items-center gap-2 text-xs sm:text-sm p-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Parcelamentos ({installmentPlans.length})</span>
            <span className="sm:hidden">Parc. ({installmentPlans.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-3">
          {recurringTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhuma transação recorrente configurada
                </p>
              </CardContent>
            </Card>
          ) : (
            recurringTransactions.map((recurring) => (
              <Card key={recurring.id} className="overflow-hidden">
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-sm truncate">{recurring.description}</h4>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={recurring.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                            {recurring.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                          <Badge variant={recurring.is_active ? 'default' : 'secondary'} className="text-xs">
                            {recurring.is_active ? 'Ativo' : 'Pausado'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {getCategoryName(recurring.category_id)}
                      </p>
                       <p className="text-sm text-muted-foreground">
                         {getFrequencyLabel(recurring.recurring_type)} • 
                         Próxima: {formatDate(recurring.next_occurrence)}
                         {recurring.end_date && ` • Até: ${formatDate(recurring.end_date)}`}
                       </p>
                       {(recurring.payment_method || recurring.payment_date || recurring.notes) && (
                         <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                           {recurring.payment_method && (
                             <div className="flex items-center gap-1">
                               {getPaymentMethodIcon(recurring.payment_method)}
                               <span>{getPaymentMethodLabel(recurring.payment_method)}</span>
                             </div>
                           )}
                           {recurring.payment_date && (
                             <div className="flex items-center gap-1">
                               <Calendar className="h-3 w-3" />
                               <span>Dia {recurring.payment_date}</span>
                             </div>
                           )}
                           {recurring.notes && (
                             <div className="flex items-center gap-1">
                               <FileText className="h-3 w-3" />
                               <span title={recurring.notes}>Obs.</span>
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className={`font-semibold text-sm ${recurring.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {recurring.type === 'income' ? '+' : '-'}{formatCurrency(recurring.amount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <div className="flex gap-2 flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRecurring(recurring.id, recurring.is_active)}
                        className="flex-1 sm:flex-none"
                      >
                        {recurring.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="ml-1 hidden sm:inline">
                          {recurring.is_active ? 'Pausar' : 'Ativar'}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecurring(recurring.id)}
                        className="flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="installment" className="space-y-3">
          {installmentPlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhum parcelamento configurado
                </p>
              </CardContent>
            </Card>
          ) : (
            installmentPlans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-sm truncate">{plan.description}</h4>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={plan.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                            {plan.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                          <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs">
                            {plan.is_active ? 'Ativo' : 'Pausado'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {getCategoryName(plan.category_id)}
                      </p>
                       <p className="text-sm text-muted-foreground">
                         {plan.completed_installments}/{plan.installment_count} parcelas • 
                         {formatCurrency(plan.installment_amount)} cada • 
                         Início: {formatDate(plan.start_date)}
                       </p>
                       {(plan.payment_method || plan.payment_date || plan.notes) && (
                         <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                           {plan.payment_method && (
                             <div className="flex items-center gap-1">
                               {getPaymentMethodIcon(plan.payment_method)}
                               <span>{getPaymentMethodLabel(plan.payment_method)}</span>
                             </div>
                           )}
                           {plan.payment_date && (
                             <div className="flex items-center gap-1">
                               <Calendar className="h-3 w-3" />
                               <span>Dia {plan.payment_date}</span>
                             </div>
                           )}
                           {plan.notes && (
                             <div className="flex items-center gap-1">
                               <FileText className="h-3 w-3" />
                               <span title={plan.notes}>Obs.</span>
                             </div>
                           )}
                         </div>
                       )}
                      <div className="w-full bg-secondary/30 rounded-full h-2 mt-3">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(plan.completed_installments / plan.installment_count) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className={`font-semibold text-sm ${plan.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {plan.type === 'income' ? '+' : '-'}{formatCurrency(plan.total_amount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <div className="flex gap-2 flex-1">
                      {plan.is_active && plan.completed_installments < plan.installment_count && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateInstallment(plan.id)}
                          className="flex-1 sm:flex-none"
                        >
                          Gerar Parcela
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleInstallment(plan.id, plan.is_active)}
                        className="flex-1 sm:flex-none"
                      >
                        {plan.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="ml-1 hidden sm:inline">
                          {plan.is_active ? 'Pausar' : 'Ativar'}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInstallment(plan.id)}
                        className="flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      <RecurringTransactionForm 
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          setShowForm(false);
          onUpdate();
        }}
      />
    </div>
  );
};