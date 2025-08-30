import { useState } from 'react';
import { Plus, Edit, Trash2, DollarSign, Calendar, Target, CheckCircle, Clock, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GoalForm } from './GoalForm';
import { Goal } from '@/types';
import { useGoalStore } from '@/store/useGoalStore';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface GoalListProps {
  onUpdate: () => void;
}

const GOAL_CATEGORY_INFO = {
  savings: { label: 'Poupança', icon: '💰', color: 'bg-green-100 text-green-800' },
  purchase: { label: 'Compra', icon: '🛒', color: 'bg-blue-100 text-blue-800' },
  travel: { label: 'Viagem', icon: '✈️', color: 'bg-purple-100 text-purple-800' },
  education: { label: 'Educação', icon: '📚', color: 'bg-yellow-100 text-yellow-800' },
  emergency: { label: 'Emergência', icon: '🚨', color: 'bg-red-100 text-red-800' },
  other: { label: 'Outros', icon: '🎯', color: 'bg-gray-100 text-gray-800' },
};

const PRIORITY_INFO = {
  low: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
  medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-800' },
};

const STATUS_INFO = {
  active: { label: 'Ativa', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Concluída', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  paused: { label: 'Pausada', icon: Pause, color: 'bg-gray-100 text-gray-800' },
};

export const GoalList = ({ onUpdate }: GoalListProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [contributionAmounts, setContributionAmounts] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const { goals, fetchGoals, deleteGoal, updateGoal, addContribution, getGoalProgress, isLoading } = useGoalStore();

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleAddGoal = () => {
    setEditingGoal(undefined);
    setShowForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDeleteGoal = async (goal: Goal) => {
    if (window.confirm(`Tem certeza que deseja excluir a meta "${goal.title}"?`)) {
      try {
        await deleteGoal(goal.id);
        toast({
          title: "Sucesso",
          description: "Meta excluída com sucesso!"
        });
        onUpdate();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao excluir a meta",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddContribution = async (goalId: string) => {
    const amount = parseFloat(contributionAmounts[goalId] || '0');
    
    if (amount <= 0) {
      toast({
        title: "Erro",
        description: "Digite um valor válido para contribuir",
        variant: "destructive"
      });
      return;
    }

    try {
      await addContribution(goalId, amount, `Contribuição de ${formatCurrency(amount)}`);
      setContributionAmounts(prev => ({ ...prev, [goalId]: '' }));
      toast({
        title: "Sucesso",
        description: `Contribuição de ${formatCurrency(amount)} adicionada!`
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar contribuição",
        variant: "destructive"
      });
    }
  };

  const toggleGoalStatus = async (goal: Goal) => {
    const newStatus = goal.status === 'active' ? 'paused' : 'active';
    try {
      await updateGoal(goal.id, { status: newStatus });
      toast({
        title: "Sucesso",
        description: `Meta ${newStatus === 'active' ? 'reativada' : 'pausada'} com sucesso!`
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar status da meta",
        variant: "destructive"
      });
    }
  };

  if (goals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Suas Metas</h2>
          <Button onClick={handleAddGoal} variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma meta encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Defina suas metas financeiras e acompanhe seu progresso
            </p>
            <Button onClick={handleAddGoal} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>

        <GoalForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={onUpdate}
          goal={editingGoal}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Suas Metas</h2>
          <p className="text-sm text-muted-foreground">
            {goals.length} metas • {goals.filter(g => g.status === 'active').length} ativas
          </p>
        </div>
        <Button onClick={handleAddGoal} variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = getGoalProgress(goal.id);
          const categoryInfo = GOAL_CATEGORY_INFO[goal.category];
          const priorityInfo = PRIORITY_INFO[goal.priority];
          const statusInfo = STATUS_INFO[goal.status];
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{categoryInfo.icon}</span>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                      <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditGoal(goal)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteGoal(goal)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{progress.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>

                {/* Target Date & Days Left */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Meta: {formatDate(goal.target_date)}</span>
                  </div>
                  <span className={`font-medium ${progress.daysLeft < 30 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {progress.daysLeft} dias restantes
                  </span>
                </div>

                {/* Remaining Amount */}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Faltam: {formatCurrency(progress.remaining)}</span>
                </div>

                {/* Quick Contribution */}
                {goal.status === 'active' && goal.current_amount < goal.target_amount && (
                  <div className="flex gap-2 pt-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={contributionAmounts[goal.id] || ''}
                      onChange={(e) => setContributionAmounts(prev => ({ 
                        ...prev, 
                        [goal.id]: e.target.value 
                      }))}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleAddContribution(goal.id)}
                      variant="income"
                      size="sm"
                    >
                      Contribuir
                    </Button>
                  </div>
                )}

                {/* Status Toggle */}
                {goal.status !== 'completed' && (
                  <div className="pt-2">
                    <Button
                      onClick={() => toggleGoalStatus(goal)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {goal.status === 'active' ? 'Pausar Meta' : 'Reativar Meta'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <GoalForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={onUpdate}
        goal={editingGoal}
      />
    </div>
  );
};