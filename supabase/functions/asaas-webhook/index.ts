// supabase/functions/asaas-webhook/index.ts
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    // O Asaas manda os dados do pagamento no formato JSON
    const body = await req.json();

    // Verificamos se o evento é de um pagamento que foi confirmado/recebido
    if (body.event === 'PAYMENT_CONFIRMED' || body.event === 'PAYMENT_RECEIVED') {
      const customerId = body.payment.customer;

      // Conecta no Supabase com permissões de administrador (Service Role)
      const supabase = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // 1. Acha quem é o usuário na sua tabela que tem esse ID do Asaas
      const { data: user } = await supabase
        .from('users') // Lembre-se: se sua tabela chamar 'profiles', mude aqui!
        .select('id')
        .eq('asaas_customer_id', customerId)
        .single();

      if (user) {
        // 2. Calcula a data de vencimento (30 dias para frente)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // 3. Atualiza o plano do usuário para 'pro' liberando o acesso
        await supabase.from('users').update({
          plan: 'pro',
          plan_expires_at: expiresAt.toISOString()
        }).eq('id', user.id);
      }
    }

    // Responde "ok" pro Asaas saber que você recebeu o recado e parar de avisar
    return new Response("Webhook processado com sucesso", { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});