// supabase/functions/abacate-webhook/index.ts
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const body = await req.json();

    // No Abacate Pay, o evento de pagamento confirmado é 'billing.paid'
    if (body.event === 'billing.paid') {
      const customerId = body.data.customer.id; 

      const supabase = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Busca na tabela PROFILES quem tem esse ID do Abacate
      const { data: user } = await supabase
        .from('profiles') 
        .select('id')
        .eq('abacate_customer_id', customerId)
        .single();

      if (user) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // VIP por 30 dias

        await supabase.from('profiles').update({
          plan: 'pro',
          plan_expires_at: expiresAt.toISOString()
        }).eq('id', user.id);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
