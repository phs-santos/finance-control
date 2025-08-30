import { useEffect } from 'react';
import { Target, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoalStore } from '@/store/useGoalStore';

export const GoalSummary = () => {
  const { fetchGoals, getGoalSummary } = useGoalStore();
  const summary = getGoalSummary();

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total de Metas',
      value: summary.totalGoals,
      icon: Target,
      bgClass: 'bg-gradient-primary'
    },
    {
      title: 'Metas Ativas',
      value: summary.activeGoals,
      icon: Clock,
      bgClass: 'bg-gradient-income'
    },
    {
      title: 'Metas Concluídas',
      value: summary.completedGoals,
      icon: CheckCircle,
      bgClass: 'bg-gradient-expense'
    },
    {
      title: 'Progresso Geral',
      value: `${summary.overallProgress.toFixed(1)}%`,
      icon: TrendingUp,
      bgClass: 'bg-gradient-primary'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="relative overflow-hidden shadow-card">
            <div className={`absolute inset-0 ${card.bgClass} opacity-5`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgClass} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};