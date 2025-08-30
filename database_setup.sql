-- =============================================================================
-- SETUP COMPLETO DO BANCO DE DADOS - Sistema de Gestão Financeira
-- Execute este script no Supabase SQL Editor
-- =============================================================================

-- 1. FUNÇÃO AUXILIAR PARA ATUALIZAR updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TABELA DE CATEGORIAS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    icon VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para categorias
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS categories_type_idx ON public.categories(type);

-- RLS para categorias
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. TABELA DE TRANSAÇÕES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para transações
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON public.transactions(user_id, date DESC);

-- RLS para transações
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. TABELA DE METAS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12, 2) DEFAULT 0 CHECK (current_amount >= 0),
    target_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('savings', 'purchase', 'travel', 'education', 'emergency', 'other')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para metas
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS goals_status_idx ON public.goals(status);
CREATE INDEX IF NOT EXISTS goals_category_idx ON public.goals(category);
CREATE INDEX IF NOT EXISTS goals_priority_idx ON public.goals(priority);
CREATE INDEX IF NOT EXISTS goals_target_date_idx ON public.goals(target_date);

-- RLS para metas
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals"
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);

-- Triggers para metas
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para definir completed_at automaticamente
CREATE OR REPLACE FUNCTION set_goal_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_goal_completed_at_trigger
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION set_goal_completed_at();

-- 5. TABELA DE CONTRIBUIÇÕES PARA METAS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para contribuições
CREATE INDEX IF NOT EXISTS goal_contributions_user_id_idx ON public.goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS goal_contributions_goal_id_idx ON public.goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS goal_contributions_date_idx ON public.goal_contributions(date);

-- RLS para contribuições
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goal contributions"
    ON public.goal_contributions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal contributions"
    ON public.goal_contributions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal contributions"
    ON public.goal_contributions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal contributions"
    ON public.goal_contributions FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_goal_contributions_updated_at
    BEFORE UPDATE ON public.goal_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar current_amount das metas automaticamente
CREATE OR REPLACE FUNCTION update_goal_current_amount()
RETURNS TRIGGER AS $$
DECLARE
    goal_id_to_update UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        goal_id_to_update = OLD.goal_id;
    ELSE
        goal_id_to_update = NEW.goal_id;
    END IF;
    
    UPDATE public.goals 
    SET current_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.goal_contributions 
        WHERE goal_id = goal_id_to_update
    )
    WHERE id = goal_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers para atualizar current_amount automaticamente
CREATE TRIGGER update_goal_amount_on_contribution_insert
    AFTER INSERT ON public.goal_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_current_amount();

CREATE TRIGGER update_goal_amount_on_contribution_update
    AFTER UPDATE ON public.goal_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_current_amount();

CREATE TRIGGER update_goal_amount_on_contribution_delete
    AFTER DELETE ON public.goal_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_current_amount();

-- 6. TABELA DE CONFIGURAÇÃO DE MÓDULOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.module_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- Índices para módulos
CREATE INDEX IF NOT EXISTS module_configs_user_id_idx ON public.module_configs(user_id);
CREATE INDEX IF NOT EXISTS module_configs_module_id_idx ON public.module_configs(module_id);
CREATE INDEX IF NOT EXISTS module_configs_enabled_idx ON public.module_configs(enabled);

-- RLS para módulos
ALTER TABLE public.module_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own module configs"
    ON public.module_configs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module configs"
    ON public.module_configs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module configs"
    ON public.module_configs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own module configs"
    ON public.module_configs FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_module_configs_updated_at
    BEFORE UPDATE ON public.module_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. FUNÇÕES PARA INSERIR DADOS PADRÃO EM NOVOS USUÁRIOS
-- =============================================================================

-- Função para criar categorias padrão
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, color, icon, type) VALUES
        (NEW.id, 'Salário', '#10B981', '💰', 'income'),
        (NEW.id, 'Freelance', '#3B82F6', '💻', 'income'),
        (NEW.id, 'Investimentos', '#8B5CF6', '📈', 'income'),
        (NEW.id, 'Alimentação', '#F59E0B', '🍽️', 'expense'),
        (NEW.id, 'Transporte', '#EF4444', '🚗', 'expense'),
        (NEW.id, 'Moradia', '#06B6D4', '🏠', 'expense'),
        (NEW.id, 'Lazer', '#EC4899', '🎉', 'expense'),
        (NEW.id, 'Saúde', '#84CC16', '🏥', 'expense');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para criar módulos padrão
CREATE OR REPLACE FUNCTION create_default_modules_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.module_configs (user_id, module_id, name, enabled, description) VALUES
        (NEW.id, 'dashboard', 'Dashboard', true, 'Visão geral financeira e gráficos'),
        (NEW.id, 'transactions', 'Transações', true, 'Controle de receitas e despesas'),
        (NEW.id, 'categories', 'Categorias', true, 'Gerenciamento de categorias'),
        (NEW.id, 'goals', 'Metas', true, 'Definição e acompanhamento de metas financeiras'),
        (NEW.id, 'reports', 'Relatórios', true, 'Relatórios detalhados e análises'),
        (NEW.id, 'budgets', 'Orçamentos', false, 'Planejamento de orçamento por categoria');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para criar dados padrão quando um usuário se registra
CREATE TRIGGER create_default_categories_on_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories_for_user();

CREATE TRIGGER create_default_modules_on_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_modules_for_user();

-- =============================================================================
-- SETUP CONCLUÍDO!
-- =============================================================================

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('categories', 'transactions', 'goals', 'goal_contributions', 'module_configs')
ORDER BY table_name;