import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Restrict CORS to your domain
const allowedOrigins = [
  'https://scanbeauty.almanaturalbeauty.it',
  'https://ndgnwsayjcptaodefzlx.lovable.app',
];

const getCorsHeaders = (origin: string | null) => {
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ 
        error: 'Autenticazione richiesta per utilizzare questa funzione' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client for auth and rate limiting
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.58.0');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Verify user token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Invalid authentication token:', authError);
      return new Response(JSON.stringify({ 
        error: 'Token di autenticazione non valido' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authenticated request from: ${user.email || user.id}`);

    // Rate limiting: Max 10 skin analyses per user per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseClient
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .or(`email.eq.${user.email || user.id},id.eq.${user.id}`)
      .gte('created_at', oneDayAgo);

    if (countError) {
      console.error('Error checking rate limit:', countError);
    }

    if (count && count >= 10) {
      console.warn(`Rate limit exceeded for user ${user.email || user.id}: ${count} analyses today`);
      return new Response(JSON.stringify({ 
        error: 'Hai raggiunto il limite giornaliero di 10 analisi. Riprova domani.',
        retryAfter: 86400
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '86400'
        },
      });
    }

    console.log(`Rate limit check passed: ${count || 0}/10 analyses today`);
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurata');
    }

    console.log('Analizzando la pelle con Lovable AI...');

    const prompt = `Analizza questa foto del viso come dermatologo esperto e valuta la salute della pelle su questi aspetti:
- IDRATAZIONE: 1-3 molto secca, 4-6 normale, 7-10 ben idratata
- ELASTICITÀ: 1-3 flaccida, 4-6 moderata, 7-10 tonica
- PIGMENTAZIONE: 1-3 molte macchie, 4-6 alcune discromie, 7-10 tono uniforme
- ACNE: 1-3 severa, 4-6 moderata, 7-10 pelle pulita
- RUGHE: 1-3 profonde, 4-6 linee sottili, 7-10 pelle liscia
- PORI: 1-3 molto dilatati, 4-6 visibili, 7-10 minimali
- ROSSORE: 1-3 diffuso, 4-6 leggero, 7-10 nessuno`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/jpeg;base64,${imageBase64}` 
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_skin',
              description: 'Analizza la pelle e fornisci punteggi da 1 a 10',
              parameters: {
                type: 'object',
                properties: {
                  idratazione: { type: 'number', description: 'Punteggio idratazione 1-10' },
                  elasticita: { type: 'number', description: 'Punteggio elasticità 1-10' },
                  pigmentazione: { type: 'number', description: 'Punteggio pigmentazione 1-10' },
                  acne: { type: 'number', description: 'Punteggio acne 1-10' },
                  rughe: { type: 'number', description: 'Punteggio rughe 1-10' },
                  pori: { type: 'number', description: 'Punteggio pori 1-10' },
                  rossore: { type: 'number', description: 'Punteggio rossore 1-10' }
                },
                required: ['idratazione', 'elasticita', 'pigmentazione', 'acne', 'rughe', 'pori', 'rossore']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_skin' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Lovable AI:', errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Troppi tentativi, riprova tra poco.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Servizio non disponibile, contatta il supporto.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Errore Lovable AI: ${response.status}`);
    }

    const data = await response.json();
    console.log('Risposta Lovable AI:', JSON.stringify(data));

    // Estrai il risultato dal tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('Nessun tool call ricevuto:', JSON.stringify(data));
      throw new Error('Formato risposta non valido');
    }

    const scores = JSON.parse(toolCall.function.arguments);
    console.log('Punteggi estratti:', scores);

    return new Response(JSON.stringify(scores), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Errore in analyze-skin:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
