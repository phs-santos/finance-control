import { useState } from 'react';
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useToast } from '@/hooks/use-toast';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onUpdate: () => void;
}

export const TransactionList = ({ transactions, onEdit, onUpdate }: TransactionListProps) => {
  const { toast } = useToast();
  const { deleteTransaction } = useTransactionStore();
  const { getById } = useCategoryStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteTransaction(id);
        toast({
          title: "Sucesso",
          description: "Transação excluída com sucesso!"
        });
        onUpdate();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao excluir a transação",
          variant: "destructive"
        });
      }
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    const category = getById(categoryId);
    return category || { name: 'Categoria não encontrada', icon: '❓', color: '#666' };
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
            <p className="text-sm">Adicione sua primeira transação para começar!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const category = getCategoryInfo(transaction.category_id);
        const isIncome = transaction.type === 'income';
        
        return (
          <Card key={transaction.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-full ${isIncome ? 'bg-income-light' : 'bg-expense-light'}`}>
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{transaction.description}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${isIncome ? 'border-income text-income' : 'border-expense text-expense'}`}
                      >
                        {category.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className={`font-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
                      {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isIncome ? (
                        <TrendingUp className="h-3 w-3 text-income" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-expense" />
                      )}
                      {isIncome ? 'Receita' : 'Despesa'}
                    </div>
                  </div>

                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(transaction)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};