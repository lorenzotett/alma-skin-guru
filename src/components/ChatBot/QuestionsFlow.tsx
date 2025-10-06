import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuestionsFlowProps {
  userName: string;
  onBack: () => void;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    question: "Come posso capire il mio tipo di pelle?",
    answer: "Il tuo tipo di pelle si può identificare osservando alcuni segnali: pelle **normale** è equilibrata, né grassa né secca; pelle **secca** tende a tirare e può presentare desquamazione; pelle **grassa** è lucida con pori dilatati; pelle **mista** è grassa nella zona T (fronte, naso, mento) e normale/secca sulle guance. Ti consiglio di fare la nostra analisi completa della pelle per una valutazione più precisa! 🔬",
    category: "Tipo di Pelle"
  },
  {
    question: "Qual è l'ordine corretto per applicare i prodotti?",
    answer: "La regola d'oro è: dal più **leggero** al più **pesante**! 🧴\n\n**Mattina:**\n1. Detergente\n2. Tonico\n3. Siero\n4. Contorno occhi\n5. Crema idratante\n6. Protezione solare (fondamentale!)\n\n**Sera:**\n1. Struccante/Detergente\n2. Secondo detergente (doppia pulizia)\n3. Tonico\n4. Siero/Trattamenti specifici\n5. Contorno occhi\n6. Crema notte",
    category: "Routine"
  },
  {
    question: "Quanto tempo ci vuole per vedere risultati?",
    answer: "La pelle si rinnova ogni **28 giorni** circa, quindi serve pazienza! ⏰\n\n• **2-4 settimane**: primi miglioramenti (idratazione, texture)\n• **4-8 settimane**: risultati più evidenti (tono uniforme, riduzione imperfezioni)\n• **3 mesi**: miglioramenti duraturi e significativi\n\nRicorda: la costanza è fondamentale! Una routine regolare porta sempre i migliori risultati. 💪",
    category: "Risultati"
  },
  {
    question: "Posso usare acidi se ho la pelle sensibile?",
    answer: "Sì, ma con cautela! 🧪\n\nPer pelli sensibili consigliamo:\n• **PHA** (Poliidrossiacidi): i più delicati\n• **Acido Lattico** a bassa concentrazione (5-10%)\n• **Acido Mandelico**: delicato ed efficace\n\n**Evita inizialmente:**\n• Acidi in concentrazioni alte\n• Retinolo troppo forte\n• Combinazioni di attivi\n\nInizia 1-2 volte a settimana e aumenta gradualmente. Se noti rossore persistente, interrompi e consulta un dermatologo.",
    category: "Ingredienti"
  },
  {
    question: "Quando devo usare il retinolo?",
    answer: "Il retinolo si usa sempre di **sera** perché:\n• È fotosensibile (la luce lo degrada)\n• Può rendere la pelle più sensibile al sole\n\n**Come iniziare:**\n1. Inizia 1-2 volte a settimana\n2. Applica su pelle asciutta\n3. Usa sempre SPF 50+ di giorno\n4. Aumenta gradualmente la frequenza\n5. Può causare iniziale secchezza/desquamazione (normale!)\n\n**Evita se:**\n• Sei incinta o allatti\n• Hai rosacea severa\n• Usi altri acidi forti contemporaneamente",
    category: "Ingredienti"
  },
  {
    question: "La protezione solare va messa anche in casa?",
    answer: "**SÌ! Assolutamente sì!** ☀️\n\nI raggi UVA attraversano:\n• Vetri delle finestre\n• Nuvole\n• Sono presenti anche d'inverno\n\nI raggi UVA causano:\n• Invecchiamento precoce\n• Macchie e discromie\n• Perdita di elasticità\n• Aumentano il rischio di tumori cutanei\n\nApplica **SPF 30-50** ogni mattina, anche se stai in casa! E riapplica ogni 2-3 ore se sei esposta alla luce diretta (vicino a finestre).",
    category: "Protezione"
  },
  {
    question: "Come tratto l'acne ormonale?",
    answer: "L'acne ormonale richiede un approccio mirato:\n\n**Ingredienti efficaci:**\n• Acido Salicilico (BHA) 2%\n• Niacinamide 5-10%\n• Retinolo/Retinaldeide\n• Tea Tree Oil\n\n**Routine consigliata:**\n1. Detergente delicato 2 volte al giorno\n2. Tonico con BHA (sera)\n3. Siero niacinamide (mattina)\n4. Crema oil-free\n5. SPF non comedogenico\n\n**Importante:**\n• Consulta un dermatologo per casi severi\n• Potrebbe servire valutazione ormonale\n• Evita di schiacciare i brufoli!\n• Cambia federa ogni 2-3 giorni",
    category: "Problematiche"
  },
  {
    question: "Quali prodotti Alma sono naturali?",
    answer: "**Tutti i prodotti Alma Natural Beauty** sono formulati con ingredienti di origine naturale! 🌿\n\nI nostri principi:\n• ✓ Ingredienti vegetali certificati\n• ✓ Estratti biologici quando possibile\n• ✓ Senza parabeni, siliconi, petrolati\n• ✓ Cruelty-free e vegan-friendly\n• ✓ Made in Italy con controllo qualità\n\nOgni prodotto indica la % di naturalità in etichetta. Per conoscere i nostri prodotti, fai l'analisi della pelle o cerca un prodotto specifico! 💚",
    category: "Alma Products"
  }
];

export const QuestionsFlow = ({ userName, onBack }: QuestionsFlowProps) => {
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const { toast } = useToast();

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  const handleCustomQuestion = () => {
    if (!customQuestion.trim()) {
      toast({
        title: "Scrivi una domanda",
        description: "Inserisci la tua domanda prima di inviare",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Grazie per la tua domanda! 💌",
      description: "Ti risponderemo via email al più presto. Nel frattempo, guarda le nostre FAQ!"
    });
    
    setCustomQuestion("");
    setShowCustomInput(false);
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna indietro
          </Button>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">
              Ciao {userName}! Sono qui per aiutarti 💡
            </h2>
            <p className="text-foreground">
              Seleziona una delle domande più frequenti o scrivimi la tua domanda specifica!
            </p>
          </div>
        </Card>

        {/* FAQ Categories */}
        <div className="grid gap-4">
          {categories.map(category => {
            const categoryFAQs = faqs.filter(faq => faq.category === category);
            return (
              <Card key={category} className="p-6">
                <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  {category}
                </h3>
                <div className="space-y-3">
                  {categoryFAQs.map((faq, index) => (
                    <div key={index}>
                      <Button
                        variant={selectedFAQ === faq ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto py-3 px-4"
                        onClick={() => setSelectedFAQ(selectedFAQ === faq ? null : faq)}
                      >
                        <span className="flex-1">{faq.question}</span>
                      </Button>
                      
                      {selectedFAQ === faq && (
                        <Card className="mt-3 p-4 bg-accent/10 border-primary/20">
                          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                            {faq.answer}
                          </p>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Custom Question */}
        <Card className="p-6">
          <h3 className="font-bold text-lg text-primary mb-4">
            Non hai trovato quello che cercavi?
          </h3>
          
          {!showCustomInput ? (
            <Button 
              onClick={() => setShowCustomInput(true)}
              variant="outline"
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Scrivi la tua domanda
            </Button>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Scrivi qui la tua domanda..."
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomQuestion()}
                className="text-base"
              />
              <div className="flex gap-3">
                <Button 
                  onClick={handleCustomQuestion}
                  className="flex-1"
                  disabled={!customQuestion.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Invia Domanda
                </Button>
                <Button 
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomQuestion("");
                  }}
                  variant="outline"
                >
                  Annulla
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Riceverai una risposta via email entro 24 ore!
              </p>
            </div>
          )}
        </Card>

        {/* CTA Analysis */}
        <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-accent/10">
          <h3 className="font-bold text-xl mb-3">
            Vuoi una consulenza personalizzata? ✨
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Fai l'analisi completa della pelle e ricevi consigli su misura per te!
          </p>
          <Button onClick={onBack} size="lg" className="w-full md:w-auto">
            Inizia Analisi della Pelle
          </Button>
        </Card>

        {/* Contact Info */}
        <Card className="p-6 text-center text-sm text-muted-foreground">
          <p>Per assistenza diretta scrivi a:</p>
          <p className="mt-2">
            <a href="mailto:info@almanaturalbeauty.it" className="text-primary underline font-medium">
              info@almanaturalbeauty.it
            </a>
          </p>
          <p className="mt-4 text-primary">Grazie per aver scelto Alma Natural Beauty! 🌸</p>
        </Card>
      </div>
    </div>
  );
};