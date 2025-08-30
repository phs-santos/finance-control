-- Criar tabela para transações recorrentes
CREATE TABLE public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  recurring_type VARCHAR NOT NULL CHECK (recurring_type IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela para planos de parcelamento
CREATE TABLE public.installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('income', 'expense')),
  total_amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  installment_count INTEGER NOT NULL CHECK (installment_count > 1),
  installment_amount NUMERIC NOT NULL,
  completed_installments INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar campos às transações existentes para vincular a transações automáticas
ALTER TABLE public.transactions 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN is_installment BOOLEAN DEFAULT false,
ADD COLUMN installment_number INTEGER,
ADD COLUMN installment_count INTEGER,
ADD COLUMN parent_transaction_id UUID,
ADD COLUMN recurring_type VARCHAR,
ADD COLUMN next_occurrence DATE;

-- Habilitar Row Level Security
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para recurring_transactions
CREATE POLICY "Users can view their own recurring transactions" 
ON public.recurring_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring transactions" 
ON public.recurring_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring transactions" 
ON public.recurring_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring transactions" 
ON public.recurring_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para installment_plans
CREATE POLICY "Users can view their own installment plans" 
ON public.installment_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own installment plans" 
ON public.installment_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own installment plans" 
ON public.installment_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own installment plans" 
ON public.installment_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_recurring_transactions_updated_at
BEFORE UPDATE ON public.recurring_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installment_plans_updated_at
BEFORE UPDATE ON public.installment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();