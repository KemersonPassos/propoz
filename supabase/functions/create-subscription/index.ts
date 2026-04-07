// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ASAAS_URL = 'https://sandbox.asaas.com/api/v3'; // URL do Sandbox!

serve(async (req: Request) => {
  try {
    // 1. Recebe os dados do cliente que vieram do seu App
    const { userId, email, name, cpfCnpj } = await req.json();

    // 2. Cria cliente no Asaas
    const customerRes = await fetch(`${ASAAS_URL}/customers`, {
      method: 'POST',
      headers: {
        // @ts-ignore
        'access_token': Deno.env.get('ASAAS_API_KEY') ?? '', // Aqui entrará sua chave depois
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, cpfCnpj })
    });
    const customer = await customerRes.json();

    // 3. Conecta no seu Supabase para salvar o ID do cliente
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Salva o asaas_customer_id na tabela users
    await supabase.from('users').update({
      asaas_customer_id: customer.id
    }).eq('id', userId);

    // 4. Cria a assinatura mensal (exemplo com PIX)
    const subRes = await fetch(`${ASAAS_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        // @ts-ignore
        'access_token': Deno.env.get('ASAAS_API_KEY') ?? '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: customer.id,
        billingType: 'PIX', 
        value: 19.90,
        nextDueDate: new Date().toISOString().split('T')[0], // Hoje
        cycle: 'MONTHLY',
        description: 'Assinatura Node Tech - Mensal'
      })
    });
    const subscription = await subRes.json();

    // 5. Devolve o link de pagamento pro seu App exibir pro cliente
    return new Response(JSON.stringify({
      paymentLink: subscription.invoiceUrl 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});