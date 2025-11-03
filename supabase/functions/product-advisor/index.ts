import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

function validateProductAdvisorInput(data: any): { valid: boolean; error?: string } {
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

// Rate limiting: Track requests per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(clientIP);
  
  if (!limit || now > limit.resetAt) {
    // Reset or create new limit: 20 requests per hour
    rateLimitMap.set(clientIP, { count: 1, resetAt: now + 3600000 });
    return { allowed: true };
  }
  
  if (limit.count >= 20) {
    const retryAfter = Math.ceil((limit.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  limit.count++;
  return { allowed: true };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIP);
    
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Troppi messaggi. Riprova tra un\'ora.'
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitCheck.retryAfter || 3600)
          },
          status: 429,
        }
      );
    }

    const requestData = await req.json();
    
    // Validate input
    const validation = validateProductAdvisorInput(requestData);
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);

    if (productsError) {
      throw new Error('Failed to fetch products');
    }

    const productsContext = products?.map(p => 
      `- ${p.name} (€${p.price}): ${p.description_short || ''}\n  Categoria: ${p.category}\n  Step: ${p.step || 'N/A'}\n  Problemi trattati: ${p.concerns_treated?.join(', ') || 'N/A'}\n  Tipo di pelle: ${p.skin_types?.join(', ') || 'N/A'}\n  Ingredienti chiave: ${p.key_ingredients?.slice(0, 3).join(', ') || 'N/A'}\n  Link: ${p.product_url}`
    ).join('\n\n') || 'Nessun prodotto disponibile';

    const systemPrompt = `Sei un'esperta consulente di bellezza AI per Alma Natural Beauty, un brand italiano di cosmetica naturale.

PRODOTTI DISPONIBILI:
${productsContext}

REGOLE DI MATCHING OBBLIGATORIE:
1. ORDINE ROUTINE SKINCARE: Detergente → Tonico → Siero → Crema → Maschera → Burro → Olio → Contorno Occhi

2. REGOLE PER TIPO DI PELLE:
   - SECCA: Bio Olio Detergente + Tonico Spray + Crema Giorno/Notte No Age
   - GRASSA: Mousse Detergente + Tonico Spray + Crema Giorno Rosa Canina + Crema Notte Fiordaliso
   - NORMALE: Bio Gel Detergente + Tonico Spray + Crema Giorno Rosa Canina
   - MISTA: Bio Olio Detergente + Tonico Spray + Elisir Bio Melograno

3. PRIORITÀ NELLE RACCOMANDAZIONI:
   - Consiglia SOLO prodotti che trattano le problematiche specifiche dell'utente
   - Calcola un MATCH SCORE (0-100) basato su problematiche (50%), tipo pelle (35%), età (15%)

STILE COMUNICAZIONE:
- Amichevole e professionale con emoji 🌸✨💚
- Paragrafi brevi e chiari
- Spiega il PERCHÉ di ogni scelta
- Consiglia 3-6 prodotti max per routine completa
- Mostra sempre il match score

FORMATTAZIONE LINK (IMPORTANTE):
- Quando menzioni un prodotto con link, usa SOLO il formato: [Nome Prodotto](URL)
- Esempio corretto: [Siero Acidi](https://almanaturalbeauty.it/prodotto/siero-acidi/)
- NON usare formati diversi o URL nudi
- Ogni link deve essere ben formato in markdown

Rispondi in italiano come una vera consulente beauty esperta.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: 'Ciao! Sono la tua consulente Alma, pronta ad aiutarti a trovare i prodotti perfetti per te! 💚✨ Raccontami: che tipo di problemi ha la tua pelle? Cosa vorresti migliorare?' }
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
        temperature: 0.8
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
