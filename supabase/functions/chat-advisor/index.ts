import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userData, recommendedProducts } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY non configurata');
    }

    console.log('Richiesta consiglio AI:', message);

    // Crea il contesto per l'AI
    const context = `
Sei un esperto consulente di bellezza per Alma Natural Beauty, un brand di cosmetici naturali italiani di lusso.

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
- Rispondi in italiano in modo professionale ma amichevole
- Usa emoticon dove appropriato 💚
- Se chiede consigli sui prodotti, spiega PERCHÉ sono perfetti per lei/lui
- Se chiede come usare i prodotti, fornisci una routine passo-passo
- Se chiede alternative, spiega le opzioni in base alle sue problematiche
- Concentrati sui benefici dei prodotti Alma Natural Beauty
- Mantieni le risposte concise (max 150 parole)
- Non menzionare mai competitor o altri brand

DOMANDA DEL CLIENTE:
${message}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: context
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore Gemini:', errorText);
      throw new Error(`Errore API Gemini: ${response.status}`);
    }

    const data = await response.json();
    console.log('Risposta Gemini ricevuta');

    const aiResponse = data.candidates[0]?.content?.parts[0]?.text;
    if (!aiResponse) {
      throw new Error('Nessuna risposta da Gemini');
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
