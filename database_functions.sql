-- =============================================================================
-- FUNÇÕES ÚTEIS PARA O SISTEMA DE GESTÃO FINANCEIRA
-- Execute após o setup principal
-- =============================================================================

-- 1. FUNÇÃO PARA OBTER RESUMO FINANCEIRO
-- =============================================================================
CREATE OR REPLACE FUNCTION get_financial_summary(user_uuid UUID)
RETURNS TABLE (
    total_income DECIMAL(12, 2),
    total_expenses DECIMAL(12, 2),
    balance DECIMAL(12, 2),
    income_by_category JSONB,
    expenses_by_category JSONB
) AS $$
DECLARE
    income_categories JSONB;
    expense_categories JSONB;
BEGIN
    -- Calcular receitas por categoria
    SELECT jsonb_object_agg(c.name, COALESCE(t.total, 0))
    INTO income_categories
    FROM public.categories c
    LEFT JOIN (
        SELECT 
            category_id,
            SUM(amount) as total
        FROM public.transactions
        WHERE user_id = user_uuid AND type = 'income'
        GROUP BY category_id
    ) t ON c.id = t.category_id
    WHERE c.user_id = user_uuid AND (c.type = 'income' OR c.type = 'both');

    -- Calcular despesas por categoria
    SELECT jsonb_object_agg(c.name, COALESCE(t.total, 0))
    INTO expense_categories
    FROM public.categories c
    LEFT JOIN (
        SELECT 
            category_id,
            SUM(amount) as total
        FROM public.transactions
        WHERE user_id = user_uuid AND type = 'expense'
        GROUP BY category_id
    ) t ON c.id = t.category_id
    WHERE c.user_id = user_uuid AND (c.type = 'expense' OR c.type = 'both');

    -- Retornar resultado
    RETURN QUERY
    SELECT 
        COALESCE((SELECT SUM(amount) FROM public.transactions WHERE user_id = user_uuid AND type = 'income'), 0) as total_income,
        COALESCE((SELECT SUM(amount) FROM public.transactions WHERE user_id = user_uuid AND type = 'expense'), 0) as total_expenses,
        COALESCE((SELECT SUM(amount) FROM public.transactions WHERE user_id = user_uuid AND type = 'income'), 0) - 
        COALESCE((SELECT SUM(amount) FROM public.transactions WHERE user_id = user_uuid AND type = 'expense'), 0) as balance,
        COALESCE(income_categories, '{}'::jsonb) as income_by_category,
        COALESCE(expense_categories, '{}'::jsonb) as expenses_by_category;
END;
$$ LANGUAGE plpgsql;

-- 2. FUNÇÃO PARA OBTER DADOS MENSAIS
-- =============================================================================
CREATE OR REPLACE FUNCTION get_monthly_data(user_uuid UUID, months_count INTEGER DEFAULT 6)
RETURNS TABLE (
    month_name TEXT,
    month_date DATE,
    income DECIMAL(12, 2),
    expense DECIMAL(12, 2),
    balance DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_series AS (
        SELECT 
            date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * (months_count - 1 - s.month_offset))::DATE as month_date,
            to_char(date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * (months_count - 1 - s.month_offset)), 'Mon YYYY') as month_name
        FROM generate_series(0, months_count - 1) as s(month_offset)
    ),
    monthly_transactions AS (
        SELECT 
            date_trunc('month', date)::DATE as month_date,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM public.transactions
        WHERE user_id = user_uuid
            AND date >= CURRENT_DATE - INTERVAL '1 month' * months_count
        GROUP BY date_trunc('month', date)::DATE
    )
    SELECT 
        ms.month_name,
        ms.month_date,
        COALESCE(mt.income, 0) as income,
        COALESCE(mt.expense, 0) as expense,
        COALESCE(mt.income, 0) - COALESCE(mt.expense, 0) as balance
    FROM monthly_series ms
    LEFT JOIN monthly_transactions mt ON ms.month_date = mt.month_date
    ORDER BY ms.month_date;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO PARA OBTER PROGRESSO DAS METAS
-- =============================================================================
CREATE OR REPLACE FUNCTION get_goals_with_progress(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    target_amount DECIMAL(12, 2),
    current_amount DECIMAL(12, 2),
    target_date DATE,
    category TEXT,
    priority TEXT,
    status TEXT,
    progress_percentage DECIMAL(5, 2),
    days_remaining INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.description,
        g.target_amount,
        g.current_amount,
        g.target_date,
        g.category,
        g.priority,
        g.status,
        CASE 
            WHEN g.target_amount > 0 THEN ROUND((g.current_amount / g.target_amount * 100)::numeric, 2)
            ELSE 0
        END as progress_percentage,
        CASE 
            WHEN g.target_date >= CURRENT_DATE THEN (g.target_date - CURRENT_DATE)::INTEGER
            ELSE 0
        END as days_remaining,
        g.created_at,
        g.completed_at
    FROM public.goals g
    WHERE g.user_id = user_uuid
    ORDER BY 
        CASE g.status 
            WHEN 'active' THEN 1 
            WHEN 'paused' THEN 2 
            ELSE 3 
        END,
        g.target_date ASC;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO PARA MIGRAR DADOS DO LOCALSTORAGE
-- =============================================================================
-- Esta função seria usada no frontend para migrar dados existentes

-- 5. VIEWS ÚTEIS
-- =============================================================================

-- View para transações com nomes de categorias
CREATE OR REPLACE VIEW transactions_with_categories AS
SELECT 
    t.*,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon
FROM public.transactions t
JOIN public.categories c ON t.category_id = c.id;

-- View para estatísticas por categoria
CREATE OR REPLACE VIEW category_statistics AS
SELECT 
    c.user_id,
    c.id,
    c.name,
    c.color,
    c.icon,
    c.type,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount END), 0) as total_expense,
    COUNT(t.id) as transaction_count,
    MAX(t.date) as last_transaction_date
FROM public.categories c
LEFT JOIN public.transactions t ON c.id = t.category_id
GROUP BY c.user_id, c.id, c.name, c.color, c.icon, c.type;

-- =============================================================================
-- QUERIES DE EXEMPLO
-- =============================================================================

-- Exemplos de como usar as funções:

-- 1. Obter resumo financeiro do usuário atual
-- SELECT * FROM get_financial_summary(auth.uid());

-- 2. Obter dados dos últimos 6 meses
-- SELECT * FROM get_monthly_data(auth.uid(), 6);

-- 3. Obter metas com progresso
-- SELECT * FROM get_goals_with_progress(auth.uid());

-- 4. Ver transações com categorias
-- SELECT * FROM transactions_with_categories WHERE user_id = auth.uid() ORDER BY date DESC LIMIT 10;

-- 5. Ver estatísticas por categoria
-- SELECT * FROM category_statistics WHERE user_id = auth.uid();