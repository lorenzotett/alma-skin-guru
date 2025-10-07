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
    const { imageBase64 } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY non configurata');
    }

    console.log('Analizzando la pelle con Gemini...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Sei un esperto dermatologo che analizza foto del viso per valutare la salute della pelle.
                
Analizza attentamente questa foto del viso e fornisci punteggi da 1 a 10 per le seguenti caratteristiche della pelle.

IMPORTANTE: Rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo o spiegazioni.

Formato richiesto:
{
  "idratazione": numero da 1 a 10,
  "elasticita": numero da 1 a 10,
  "pigmentazione": numero da 1 a 10,
  "acne": numero da 1 a 10,
  "rughe": numero da 1 a 10,
  "pori": numero da 1 a 10,
  "rossore": numero da 1 a 10
}

Criteri di valutazione dettagliati:

IDRATAZIONE (1-10):
- 1-3: Pelle molto disidratata, opaca, desquamazione evidente
- 4-6: Pelle normale, leggera disidratazione in alcune zone
- 7-10: Pelle ben idratata, luminosa, rimpolpata, aspetto sano

ELASTICITÀ (1-10):
- 1-3: Pelle flaccida, priva di tono, cedimenti evidenti
- 4-6: Elasticità moderata, alcuni segni di perdita di tono
- 7-10: Pelle tonica, compatta, elastica, aspetto giovane

PIGMENTAZIONE (1-10):
- 1-3: Macchie scure diffuse, tono molto irregolare, iperpigmentazione evidente
- 4-6: Alcune discromie, tono leggermente irregolare
- 7-10: Tono uniforme, nessuna macchia visibile, colorito omogeneo

ACNE (1-10):
- 1-3: Acne severa, molti brufoli, comedoni, infiammazioni
- 4-6: Acne moderata, alcune imperfezioni, punti neri
- 7-10: Pelle pulita, nessuna imperfezione, al massimo un paio di punti neri

RUGHE (1-10):
- 1-3: Rughe profonde e diffuse, linee marcate su tutto il viso
- 4-6: Alcune linee sottili, rughe d'espressione visibili
- 7-10: Pelle liscia, al massimo linee sottilissime, aspetto giovane

PORI (1-10):
- 1-3: Pori molto dilatati e visibili su tutto il viso
- 4-6: Pori moderatamente visibili, soprattutto zona T
- 7-10: Pori minimali, texture della pelle levigata e fine

ROSSORE (1-10):
- 1-3: Rossore diffuso, couperose evidente, irritazioni
- 4-6: Leggero rossore localizzato, qualche capillare visibile
- 7-10: Nessun rossore, tono uniforme, pelle calma

Analizza con attenzione la foto e fornisci punteggi precisi e realistici.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
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
    console.log('Risposta Gemini:', JSON.stringify(data));

    const textContent = data.candidates[0]?.content?.parts[0]?.text;
    if (!textContent) {
      throw new Error('Nessuna risposta da Gemini');
    }

    // Estrai il JSON dalla risposta
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Testo ricevuto:', textContent);
      throw new Error('Formato risposta non valido');
    }

    const scores = JSON.parse(jsonMatch[0]);
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
