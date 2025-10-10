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

function validateChatInput(data: any): { valid: boolean; error?: string } {
  if (!data.message || typeof data.message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  
  if (data.message.length > 1000) {
    return { valid: false, error: 'Message too long (max 1000 characters)' };
  }
  
  if (!data.userData || typeof data.userData !== 'object') {
    return { valid: false, error: 'User data is required' };
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
    const validation = validateChatInput(requestData);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, userData, recommendedProducts } = requestData;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurata');
    }

    // Sanitize user inputs to prevent prompt injection
    const sanitizedUserData = {
      name: sanitizeString(userData.name, 100),
      skinType: sanitizeString(userData.skinType, 50),
      age: Number(userData.age) || 0,
      concerns: Array.isArray(userData.concerns) 
        ? userData.concerns.map((c: any) => sanitizeString(c, 100)).slice(0, 10)
        : [],
      skinScores: userData.skinScores || {}
    };

    const systemPrompt = `Sei un esperto consulente di bellezza per Alma Natural Beauty, un brand di cosmetici naturali italiani di lusso.

PROFILO CLIENTE:
- Nome: ${sanitizedUserData.name}
- Tipo di pelle: ${sanitizedUserData.skinType}
- Età: ${sanitizedUserData.age} anni
- Problematiche: ${sanitizedUserData.concerns.join(', ')}

ANALISI PELLE (punteggi da 1-10):
${Object.entries(sanitizedUserData.skinScores)
  .map(([key, value]) => `- ${key}: ${value}/10`)
  .join('\n')}

PRODOTTI RACCOMANDATI:
${recommendedProducts?.map((p: any) => 
  `- ${sanitizeString(p.name, 200)} (${sanitizeString(p.category, 50)}): ${sanitizeString(p.description_short, 300)}`
).join('\n') || 'Nessun prodotto raccomandato'}

ISTRUZIONI:
- Rispondi in italiano in modo MOLTO amichevole e personalizzato, come un'amica esperta di bellezza 💚
- Usa emoticon in modo naturale per rendere la conversazione più calda
- Se chiede consigli sui prodotti, spiega in modo DETTAGLIATO e SPECIFICO perché ogni prodotto è perfetto per la sua pelle
- Mantieni le risposte tra 100-200 parole
- Non menzionare mai competitor o altri brand
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
          { role: 'user', content: sanitizeString(message, 1000) }
        ],
        max_tokens: 500,
        temperature: 0.7
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
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Nessuna risposta da AI');
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Errore durante la conversazione. Riprova.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
