import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = [
  'https://scanbeauty.almanaturalbeauty.it',
  'https://ndgnwsayjcptaodefzlx.lovable.app',
  'https://alma-skin.lovable.app',
];

const getCorsHeaders = (origin: string | null) => {
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

// Input validation
function sanitizeString(input: any, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

function validateQuestionsInput(data: any): { valid: boolean; error?: string } {
  if (!data.message || typeof data.message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  
  if (data.message.length > 1000) {
    return { valid: false, error: 'Message too long (max 1000 characters)' };
  }
  
  if (data.conversationHistory && !Array.isArray(data.conversationHistory)) {
    return { valid: false, error: 'Invalid conversation history' };
  }
  
  if (data.conversationHistory && data.conversationHistory.length > 50) {
    return { valid: false, error: 'Conversation history too long' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    // Validate input
    const validation = validateQuestionsInput(requestData);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, conversationHistory, userName } = requestData;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const sanitizedUserName = sanitizeString(userName, 100);

    const systemPrompt = `Sei un'esperta consulente di bellezza e skincare per Alma Natural Beauty, un brand italiano di cosmetica naturale.

IL TUO RUOLO:
- Rispondi a domande generali su skincare, routine beauty, ingredienti, problemi della pelle
- Fornisci consigli professionali basati sulla scienza della pelle
- Spiega ingredienti, benefici, modalità d'uso
- Dai consigli su routine mattina/sera, ordine di applicazione prodotti

EXPERTISE:
- Tipi di pelle (secca, grassa, mista, normale, sensibile)
- Problematiche comuni (acne, rughe, macchie, rossori, disidratazione)
- Ingredienti attivi (acido ialuronico, retinolo, vitamina C, niacinamide, acidi AHA/BHA)
- Routine skincare corretta
- Protezione solare
- Anti-aging
- Ingredienti naturali e biologici

IMPORTANTE:
- Se chiede di prodotti specifici Alma, suggerisci di usare la chat "Info Prodotti"
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

FORMATTAZIONE LINK (SE NECESSARIO):
- Se devi inserire link esterni, usa SOLO il formato markdown: [Testo](URL)
- Esempio: [Guida Skincare](https://esempio.com/guida)
- NON usare URL nudi senza formattazione

Rispondi sempre in italiano in modo professionale, competente e amichevole.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: 'Ciao! Sono la tua esperta skincare Alma. Sono qui per rispondere a tutte le tue domande su bellezza, cura della pelle e routine beauty! 💚✨ Cosa vuoi sapere?' }
    ];

    // Sanitize and limit conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      const sanitizedHistory = conversationHistory.slice(-20).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: sanitizeString(msg.content, 1000)
      }));
      messages.push(...sanitizedHistory);
    }

    messages.push({ role: 'user', content: sanitizeString(message, 1000) });

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
      
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 
      'Mi dispiace, non riesco a rispondere al momento. Riprova!';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Si è verificato un errore',
        response: 'Mi dispiace, sto avendo un problema tecnico. Per favore riprova tra poco! 🙏'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
