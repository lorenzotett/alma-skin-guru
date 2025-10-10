import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    console.log(`Authenticated product advisor request from: ${user.email || user.id}`);
    const { message, conversationHistory, userName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    // Build context with product information
    const productsContext = products?.map(p => 
      `- ${p.name} (€${p.price}): ${p.description_short || ''}\n  Categoria: ${p.category}\n  Step: ${p.step || 'N/A'}\n  Problemi trattati: ${p.concerns_treated?.join(', ') || 'N/A'}\n  Tipo di pelle: ${p.skin_types?.join(', ') || 'N/A'}\n  Ingredienti chiave: ${p.key_ingredients?.slice(0, 3).join(', ') || 'N/A'}\n  Link: ${p.product_url}`
    ).join('\n\n') || 'Nessun prodotto disponibile';

    const systemPrompt = `Sei un'esperta consulente di bellezza AI per Alma Natural Beauty, un brand italiano di cosmetica naturale.

PRODOTTI DISPONIBILI:
${productsContext}

REGOLE DI MATCHING OBBLIGATORIE (dal database di conoscenza):

1. ORDINE ROUTINE SKINCARE (rispetta sempre questo ordine):
   1. Detergente → 2. Tonico → 3. Siero → 4. Crema → 5. Maschera → 6. Burro → 7. Olio → 8. Contorno Occhi

2. REGOLE PER TIPO DI PELLE:
   - SECCA: Bio Olio Detergente + Tonico Spray + Crema Giorno/Notte No Age
   - GRASSA: Mousse Detergente + Tonico Spray + Crema Giorno Rosa Canina + Crema Notte Fiordaliso
   - NORMALE: Bio Gel Detergente + Tonico Spray + Crema Giorno Rosa Canina
   - MISTA: Bio Olio Detergente + Tonico Spray + Elisir Bio Melograno
   - ASFITTICA: Bio Olio/Gel Detergente + Tonico Spray

3. REGOLE PER PROBLEMATICHE SPECIFICHE:
   - RUGHE: Bio Gel Detergente + Acido Ialuronico Puro + Crema Giorno/Notte No Age + Maschera TNT Ialuronico e Peptidi
   - ROSACEA: [prodotti specifici per pelli sensibili]
   - ACNE (anche tardiva): Prodotti specifici con azione purificante
   - MACCHIE/PIGMENTAZIONE: Fluido Acidi + Siero Acidi + Crema Acidi H24

4. PRIORITÀ NELLE RACCOMANDAZIONI:
   - Se una persona ha SIA acne CHE rosacea → consiglia routine per rosacea
   - Abbina sempre il tipo di pelle con la problematica specifica
   - Per routine completa: suggerisci 4-6 prodotti nell'ordine corretto

IL TUO APPROCCIO:

1. ANALIZZA attentamente le informazioni dell'utente (tipo pelle, problematiche, età)

2. CALCOLA un MATCH SCORE (0-100) per ogni prodotto basato su:
   - Problematiche trattate (50%) - PRIORITÀ ASSOLUTA
   - Compatibilità tipo di pelle (35%)
   - Età/esigenze specifiche (15%)
   
   ⚠️ CRITICO: Consiglia SOLO prodotti che trattano le problematiche specifiche dell'utente.
   Se un prodotto non tratta le concern dell'utente, NON consigliarlo anche se va bene per il tipo di pelle.

3. PRESENTA i prodotti con questa struttura:
   📊 DIAGNOSI: [breve riassunto delle esigenze]
   
   🎯 ROUTINE CONSIGLIATA:
   Per ogni prodotto mostra:
   - Nome prodotto + Match Score (es. 92/100)
   - Perché è perfetto per te (collegamento diretto a regole e problematiche)
   - Caratteristiche chiave (2-3 punti)
   - Prezzo
   - Link diretto

4. STILE COMUNICAZIONE:
   - Amichevole e professionale con emoji 🌸✨💚
   - Paragrafi brevi e chiari
   - Spiega il PERCHÉ di ogni scelta
   - Tutti i prodotti su almanaturalbeauty.it

IMPORTANTE:
- NON menzionare MAI codici sconto
- Se mancano info, chiedi dettagli specifici
- Consiglia 3-6 prodotti max per routine completa
- Mostra sempre il match score e la logica dietro ogni suggerimento

Rispondi in italiano come una vera consulente beauty esperta.`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: 'Ciao! Sono la tua consulente Alma, pronta ad aiutarti a trovare i prodotti perfetti per te! 💚✨ Raccontami: che tipo di problemi ha la tua pelle? Cosa vorresti migliorare?' }
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

    console.log('Calling Lovable AI...');

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
        temperature: 0.8
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
    console.error('Error in product-advisor function:', error);
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
