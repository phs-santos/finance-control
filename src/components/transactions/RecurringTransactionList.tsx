import { useState, useEffect } from 'react';
import { Edit2, Trash2, Repeat, Calendar, Play, Pause } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecurringTransactionListProps {
  onUpdate: () => void;
}

export const RecurringTransactionList = ({ onUpdate }: RecurringTransactionListProps) => {
  const [activeTab, setActiveTab] = useState<'recurring' | 'installment'>('recurring');

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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Transações Automáticas</h3>
        <Button 
          onClick={processAutomaticTransactions}
          variant="outline"
          size="sm"
        >
          Processar Pendentes
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          As transações recorrentes e parcelas são processadas automaticamente. 
          Use o botão "Processar Pendentes" para forçar o processamento.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'recurring' | 'installment')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recurring" className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Recorrentes ({recurringTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="installment" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Parcelamentos ({installmentPlans.length})
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
              <Card key={recurring.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{recurring.description}</h4>
                        <Badge variant={recurring.type === 'income' ? 'default' : 'destructive'}>
                          {recurring.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                        <Badge variant={recurring.is_active ? 'default' : 'secondary'}>
                          {recurring.is_active ? 'Ativo' : 'Pausado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {getCategoryName(recurring.category_id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getFrequencyLabel(recurring.recurring_type)} • 
                        Próxima: {formatDate(recurring.next_occurrence)}
                        {recurring.end_date && ` • Até: ${formatDate(recurring.end_date)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${recurring.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {recurring.type === 'income' ? '+' : '-'}{formatCurrency(recurring.amount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRecurring(recurring.id, recurring.is_active)}
                    >
                      {recurring.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRecurring(recurring.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              <Card key={plan.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{plan.description}</h4>
                        <Badge variant={plan.type === 'income' ? 'default' : 'destructive'}>
                          {plan.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Ativo' : 'Pausado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {getCategoryName(plan.category_id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {plan.completed_installments}/{plan.installment_count} parcelas • 
                        {formatCurrency(plan.installment_amount)} cada • 
                        Início: {formatDate(plan.start_date)}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(plan.completed_installments / plan.installment_count) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-semibold ${plan.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {plan.type === 'income' ? '+' : '-'}{formatCurrency(plan.total_amount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {plan.is_active && plan.completed_installments < plan.installment_count && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateInstallment(plan.id)}
                      >
                        Gerar Parcela
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleInstallment(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteInstallment(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};