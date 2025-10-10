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

    console.log(`Authenticated questions request from: ${user.email || user.id}`);
    const { message, conversationHistory, userName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Sei un'esperta consulente di bellezza e skincare per Alma Natural Beauty, un brand italiano di cosmetica naturale.

IL TUO RUOLO:
- Rispondi a domande generali su skincare, routine beauty, ingredienti, problemi della pelle
- Fornisci consigli professionali basati sulla scienza della pelle
- Spiega ingredienti, benefici, modalità d'uso
- Dai consigli su routine mattina/sera, ordine di applicazione prodotti
- Rispondi a dubbi su compatibilità ingredienti, problematiche specifiche

EXPERTISE:
- Tipi di pelle (secca, grassa, mista, normale, sensibile)
- Problematiche comuni (acne, rughe, macchie, rossori, disidratazione)
- Ingredienti attivi (acido ialuronico, retinolo, vitamina C, niacinamide, acidi AHA/BHA)
- Routine skincare corretta
- Protezione solare
- Anti-aging
- Ingredienti naturali e biologici

IMPORTANTE:
- Se ${userName} chiede di prodotti specifici Alma, suggerisci di usare la chat "Info Prodotti"
- Se chiede un'analisi personalizzata, suggerisci di fare l'analisi completa della pelle
- Sii sempre professionale ma amichevole
- Usa emoji per rendere la conversazione piacevole 🌸✨💚
- Fornisci risposte dettagliate ma comprensibili
- Se non sei sicura, consiglia di consultare un dermatologo

STILE:
- Risposte chiare e ben strutturate
- Usa elenchi puntati quando utile
- Spiega termini tecnici in modo semplice
- Brevi paragrafi, facili da leggere

Rispondi sempre in italiano in modo professionale, competente e amichevole.`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: 'Ciao! Sono la tua esperta skincare Alma. Sono qui per rispondere a tutte le tue domande su bellezza, cura della pelle e routine beauty! 💚✨ Cosa vuoi sapere?' }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    console.log('Calling Lovable AI for questions...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: 'Mi dispiace, troppi tentativi. Riprova tra poco! 🙏'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          response: 'Servizio temporaneamente non disponibile. Contatta il supporto! 🙏'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');

    const aiResponse = data.choices?.[0]?.message?.content || 
      'Mi dispiace, non riesco a rispondere al momento. Riprova!';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in questions-advisor function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Mi dispiace, sto avendo un problema tecnico. Per favore riprova tra poco! 🙏'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
