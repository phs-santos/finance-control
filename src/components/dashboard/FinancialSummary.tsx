import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialSummary as FinancialSummaryType } from '@/types';

interface FinancialSummaryProps {
  summary: FinancialSummaryType;
}

export const FinancialSummary = ({ summary }: FinancialSummaryProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const cards = [
    {
      title: 'Receitas',
      value: summary.totalIncome,
      icon: TrendingUp,
      variant: 'income' as const,
      bgClass: 'bg-gradient-income'
    },
    {
      title: 'Despesas',
      value: summary.totalExpenses,
      icon: TrendingDown,
      variant: 'expense' as const,
      bgClass: 'bg-gradient-expense'
    },
    {
      title: 'Saldo',
      value: summary.balance,
      icon: DollarSign,
      variant: summary.balance >= 0 ? 'income' as const : 'expense' as const,
      bgClass: summary.balance >= 0 ? 'bg-gradient-income' : 'bg-gradient-expense'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <div className="text-2xl font-bold">
                {formatCurrency(card.value)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Icon className="h-3 w-3 mr-1" />
                {card.title.toLowerCase()} do período
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};