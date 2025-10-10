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
        error: 'Autenticazione richiesta' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client for auth
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
        error: 'Token non valido' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authenticated chat request from: ${user.email || user.id}`);
    const { message, userData, recommendedProducts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurata');
    }

    console.log('Richiesta consiglio AI:', message);

    // Crea il contesto per l'AI
    const systemPrompt = `Sei un esperto consulente di bellezza per Alma Natural Beauty, un brand di cosmetici naturali italiani di lusso.

PROFILO CLIENTE:
- Nome: ${userData.name}
- Tipo di pelle: ${userData.skinType}
- Età: ${userData.age} anni
- Problematiche: ${userData.concerns?.join(', ')}

ANALISI PELLE (punteggi da 1-10):
${userData.skinScores ? Object.entries(userData.skinScores)
  .map(([key, value]) => `- ${key}: ${value}/10`)
  .join('\n') : 'Non disponibile'}

PRODOTTI RACCOMANDATI:
${recommendedProducts?.map((p: any) => 
  `- ${p.name} (${p.category}): ${p.description_short || ''}`
).join('\n') || 'Nessun prodotto raccomandato'}

ISTRUZIONI:
- Rispondi in italiano in modo MOLTO amichevole e personalizzato, come un'amica esperta di bellezza 💚
- Usa emoticon in modo naturale per rendere la conversazione più calda
- Se chiede consigli sui prodotti, spiega in modo DETTAGLIATO e SPECIFICO perché ogni prodotto è perfetto per la sua pelle, basandoti sull'analisi AI
- Se chiede come usare i prodotti, fornisci una routine passo-passo CHIARA con orari (mattina/sera) e quantità suggerite
- Se chiede quando vedrà i risultati, dai tempistiche realistiche (es: "primi risultati dopo 2 settimane, miglioramento visibile dopo 4-6 settimane")
- Se chiede combinazioni, spiega quali prodotti usare insieme e quali alternare
- Dai consigli pratici e applicabili (es: "applica dopo la doccia", "massaggia con movimenti circolari")
- Concentrati sui benefici CONCRETI dei prodotti Alma Natural Beauty per le sue problematiche specifiche
- Mantieni le risposte tra 100-200 parole - né troppo corte né troppo lunghe
- Non menzionare mai competitor o altri brand
- Usa un tono entusiasta ma professionale, come se fossi davvero felice di aiutare
- Quando menzioni i prodotti, usa il loro nome completo e spiega PERCHÉ li hai scelti`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
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
    console.log('Risposta Lovable AI ricevuta');

    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Nessuna risposta da Lovable AI');
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Errore in chat-advisor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
