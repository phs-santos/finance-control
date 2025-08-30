import { useState } from 'react';
import { Plus, X, Target, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Goal } from '@/types';
import { useGoalStore } from '@/store/useGoalStore';
import { useToast } from '@/hooks/use-toast';

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: Goal;
}

const GOAL_CATEGORIES = [
  { value: 'savings', label: 'Poupança', icon: '💰' },
  { value: 'purchase', label: 'Compra', icon: '🛒' },
  { value: 'travel', label: 'Viagem', icon: '✈️' },
  { value: 'education', label: 'Educação', icon: '📚' },
  { value: 'emergency', label: 'Emergência', icon: '🚨' },
  { value: 'other', label: 'Outros', icon: '🎯' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'text-blue-600' },
  { value: 'medium', label: 'Média', color: 'text-yellow-600' },
  { value: 'high', label: 'Alta', color: 'text-red-600' },
];

export const GoalForm = ({ isOpen, onClose, onSuccess, goal }: GoalFormProps) => {
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || '');
  const [targetDate, setTargetDate] = useState(goal?.target_date || '');
  const [category, setCategory] = useState<Goal['category']>(goal?.category || 'savings');
  const [priority, setPriority] = useState<Goal['priority']>(goal?.priority || 'medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { createGoal, updateGoal } = useGoalStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !targetAmount || !targetDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(targetAmount);
    if (amount <= 0) {
      toast({
        title: "Erro",
        description: "O valor da meta deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    const selectedDate = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Erro",
        description: "A data da meta não pode ser no passado",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const goalData = {
        title: title.trim(),
        description: description.trim(),
        target_amount: amount,
        target_date: targetDate,
        category,
        priority,
      };

      if (goal) {
        await updateGoal(goal.id, goalData);
        toast({
          title: "Sucesso",
          description: "Meta atualizada com sucesso!"
        });
      } else {
        await createGoal(goalData);
        toast({
          title: "Sucesso",
          description: "Meta criada com sucesso!"
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar a meta",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetAmount('');
    setTargetDate('');
    setCategory('savings');
    setPriority('medium');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">
            {goal ? 'Editar Meta' : 'Nova Meta'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Viagem para Europa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva sua meta..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Target Amount */}
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Valor da Meta *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label htmlFor="targetDate">Data Alvo *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={(value: Goal['category']) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(value: Goal['priority']) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {isSubmitting ? 'Salvando...' : (goal ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};