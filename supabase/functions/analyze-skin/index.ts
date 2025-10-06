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
                text: `Analizza questa foto del viso e fornisci punteggi da 1 a 10 per le seguenti caratteristiche della pelle. 
                Rispondi SOLO con un oggetto JSON valido nel seguente formato, senza testo aggiuntivo:
                {
                  "idratazione": numero da 1 a 10,
                  "elasticita": numero da 1 a 10,
                  "pigmentazione": numero da 1 a 10,
                  "acne": numero da 1 a 10 (10 = nessuna acne),
                  "rughe": numero da 1 a 10 (10 = nessuna ruga),
                  "pori": numero da 1 a 10 (10 = pori minimali),
                  "rossore": numero da 1 a 10 (10 = nessun rossore)
                }
                
                Criteri di valutazione:
                - Idratazione: valuta la luminosità e l'aspetto rimpolpato della pelle
                - Elasticità: valuta la tonicità e la compattezza
                - Pigmentazione: uniformità del tono, assenza di macchie
                - Acne: presenza di imperfezioni, brufoli, comedoni
                - Rughe: presenza di linee sottili e rughe profonde
                - Pori: dimensione e visibilità dei pori
                - Rossore: presenza di arrossamenti, couperose, irritazioni`
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
