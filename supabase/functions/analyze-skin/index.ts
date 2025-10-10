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
function validateImageInput(imageBase64: any): { valid: boolean; error?: string } {
  if (typeof imageBase64 !== 'string') {
    return { valid: false, error: 'Image data must be a string' };
  }
  
  // Check max size (5MB base64 = ~6.7MB actual)
  if (imageBase64.length > 6_700_000) {
    return { valid: false, error: 'Image size exceeds 5MB limit' };
  }
  
  // Basic base64 validation
  if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
    return { valid: false, error: 'Invalid image format' };
  }
  
  return { valid: true };
}

// IP-based rate limiting storage (in-memory for simplicity)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(clientIP);
  
  if (!limit || now > limit.resetTime) {
    // Reset or new entry
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 24 * 60 * 60 * 1000 });
    return { allowed: true };
  }
  
  if (limit.count >= 10) {
    const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
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
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Hai raggiunto il limite giornaliero di 10 analisi. Riprova domani.',
        retryAfter: rateLimitCheck.retryAfter
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitCheck.retryAfter || 86400)
        },
      });
    }

    const { imageBase64 } = await req.json();
    
    // Validate input
    const validation = validateImageInput(imageBase64);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurata');
    }

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
      
      throw new Error(`Errore AI: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('Formato risposta non valido');
    }

    const scores = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(scores), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Errore durante l\'analisi. Riprova.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
