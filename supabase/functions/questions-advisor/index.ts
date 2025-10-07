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
    const { message, conversationHistory, userName } = await req.json();
    
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
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

    // Build conversation for Gemini
    const geminiMessages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'Ciao! Sono la tua esperta skincare Alma. Sono qui per rispondere a tutte le tue domande su bellezza, cura della pelle e routine beauty! 💚✨ Cosa vuoi sapere?' }]
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

    console.log('Calling Gemini API for questions...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
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
