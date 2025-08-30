import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid user token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const userId = userData.user.id;
    const today = new Date().toISOString().split('T')[0];
    const generatedTransactions = [];

    console.log(`Processing automatic transactions for user: ${userId}`);

    // Processar transações recorrentes
    const { data: recurringTransactions, error: recurringError } = await supabaseClient
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_occurrence', today);

    if (recurringError) {
      throw new Error(`Error fetching recurring transactions: ${recurringError.message}`);
    }

    console.log(`Found ${recurringTransactions?.length || 0} recurring transactions to process`);

    for (const recurring of recurringTransactions || []) {
      // Verificar se já foi processada hoje
      const { data: existingTransaction } = await supabaseClient
        .from('transactions')
        .select('id')
        .eq('parent_transaction_id', recurring.id)
        .eq('date', today)
        .single();

      if (existingTransaction) {
        console.log(`Recurring transaction ${recurring.id} already processed today`);
        continue;
      }

      // Verificar se ainda está dentro do período
      if (recurring.end_date && new Date(recurring.end_date) < new Date(today)) {
        // Desativar transação recorrente expirada
        await supabaseClient
          .from('recurring_transactions')
          .update({ is_active: false })
          .eq('id', recurring.id);
        console.log(`Deactivated expired recurring transaction: ${recurring.id}`);
        continue;
      }

      // Criar transação
      const { data: newTransaction, error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          category_id: recurring.category_id,
          type: recurring.type,
          amount: recurring.amount,
          description: `${recurring.description} (Recorrente)`,
          date: today,
          is_recurring: true,
          recurring_type: recurring.recurring_type,
          parent_transaction_id: recurring.id,
        })
        .select()
        .single();

      if (transactionError) {
        console.error(`Error creating recurring transaction: ${transactionError.message}`);
        continue;
      }

      generatedTransactions.push(newTransaction);

      // Calcular próxima ocorrência
      const nextOccurrence = new Date(recurring.next_occurrence);
      switch (recurring.recurring_type) {
        case 'weekly':
          nextOccurrence.setDate(nextOccurrence.getDate() + 7);
          break;
        case 'monthly':
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
          break;
        case 'yearly':
          nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
          break;
      }

      // Atualizar próxima ocorrência
      await supabaseClient
        .from('recurring_transactions')
        .update({ next_occurrence: nextOccurrence.toISOString().split('T')[0] })
        .eq('id', recurring.id);

      console.log(`Processed recurring transaction: ${recurring.id}, next occurrence: ${nextOccurrence.toISOString().split('T')[0]}`);
    }

    // Processar parcelas pendentes
    const { data: installmentPlans, error: installmentError } = await supabaseClient
      .from('installment_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (installmentError) {
      throw new Error(`Error fetching installment plans: ${installmentError.message}`);
    }

    console.log(`Found ${installmentPlans?.length || 0} installment plans to check`);

    for (const plan of installmentPlans || []) {
      if (plan.completed_installments >= plan.installment_count) {
        // Desativar plano completado
        await supabaseClient
          .from('installment_plans')
          .update({ is_active: false })
          .eq('id', plan.id);
        console.log(`Deactivated completed installment plan: ${plan.id}`);
        continue;
      }

      const nextInstallmentDate = new Date(plan.start_date);
      nextInstallmentDate.setMonth(nextInstallmentDate.getMonth() + plan.completed_installments);
      const nextInstallmentDateStr = nextInstallmentDate.toISOString().split('T')[0];

      if (nextInstallmentDateStr <= today) {
        // Verificar se já foi processada
        const nextInstallmentNumber = plan.completed_installments + 1;
        const { data: existingInstallment } = await supabaseClient
          .from('transactions')
          .select('id')
          .eq('parent_transaction_id', plan.id)
          .eq('installment_number', nextInstallmentNumber)
          .single();

        if (existingInstallment) {
          console.log(`Installment ${nextInstallmentNumber} for plan ${plan.id} already exists`);
          continue;
        }

        // Criar parcela
        const { data: newInstallment, error: installmentTransactionError } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: userId,
            category_id: plan.category_id,
            type: plan.type,
            amount: plan.installment_amount,
            description: `${plan.description} (${nextInstallmentNumber}/${plan.installment_count})`,
            date: nextInstallmentDateStr,
            is_installment: true,
            installment_number: nextInstallmentNumber,
            installment_count: plan.installment_count,
            parent_transaction_id: plan.id,
          })
          .select()
          .single();

        if (installmentTransactionError) {
          console.error(`Error creating installment: ${installmentTransactionError.message}`);
          continue;
        }

        generatedTransactions.push(newInstallment);

        // Atualizar contador de parcelas completadas
        const updatedCompletedInstallments = nextInstallmentNumber;
        const isStillActive = updatedCompletedInstallments < plan.installment_count;

        await supabaseClient
          .from('installment_plans')
          .update({ 
            completed_installments: updatedCompletedInstallments,
            is_active: isStillActive
          })
          .eq('id', plan.id);

        console.log(`Processed installment ${nextInstallmentNumber}/${plan.installment_count} for plan: ${plan.id}`);
      }
    }

    console.log(`Generated ${generatedTransactions.length} automatic transactions`);

    return new Response(JSON.stringify({
      success: true,
      generated_count: generatedTransactions.length,
      transactions: generatedTransactions
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing automatic transactions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});