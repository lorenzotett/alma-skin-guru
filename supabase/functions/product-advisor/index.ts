import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, userName } = await req.json();
    
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
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
      `- ${p.name} (€${p.price}): ${p.description_short || ''}\n  Categoria: ${p.category}\n  Problemi trattati: ${p.concerns_treated?.join(', ') || 'N/A'}\n  Ingredienti chiave: ${p.key_ingredients?.slice(0, 3).join(', ') || 'N/A'}\n  Link: ${p.product_url}`
    ).join('\n\n') || 'Nessun prodotto disponibile';

    const systemPrompt = `Sei un'esperta consulente di bellezza AI per Alma Natural Beauty, un brand italiano di cosmetica naturale.

PRODOTTI DISPONIBILI:
${productsContext}

IL TUO RUOLO:
- Aiuta ${userName} a trovare i prodotti giusti per le sue esigenze
- Fai domande specifiche sui problemi della pelle, preoccupazioni, preferenze
- Consiglia prodotti basati sui problemi specifici menzionati dall'utente
- Spiega DOVE si trovano i prodotti (su almanaturalbeauty.it) e come ordinarli
- Fornisci informazioni dettagliate su ingredienti, benefici, modo d'uso
- Usa un tono amichevole, professionale ed entusiasta con emoji 🌸✨💚

IMPORTANTE:
- Chiedi sempre dettagli specifici prima di consigliare
- Se l'utente ha dubbi su più prodotti, aiutalo a scegliere quello più adatto
- Menziona sempre il codice sconto ALMA15 per risparmiare il 15%
- Tutti i prodotti sono disponibili su https://almanaturalbeauty.it
- Se un prodotto non esiste nel catalogo, suggerisci alternative simili
- Sii sempre onesta: se qualcosa non è chiaro, chiedi più informazioni

STILE DI CONVERSAZIONE:
- Brevi paragrafi, facili da leggere
- Usa emoji per rendere la conversazione più calda
- Chiedi sempre se l'utente ha altre domande
- Non essere troppo tecnica, spiega in modo semplice

Rispondi in italiano in modo naturale, come farebbe una vera consulente beauty in un negozio.`;

    // Build conversation for Gemini
    const geminiMessages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'Ciao! Sono la tua consulente Alma, pronta ad aiutarti a trovare i prodotti perfetti per te! 💚✨ Raccontami: che tipo di problemi ha la tua pelle? Cosa vorresti migliorare?' }]
      }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        if (msg.role === 'user') {
          geminiMessages.push({
            role: 'user',
            parts: [{ text: msg.content }]
          });
        } else if (msg.role === 'assistant') {
          geminiMessages.push({
            role: 'model',
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    // Add current message
    geminiMessages.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log('Calling Gemini API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
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
