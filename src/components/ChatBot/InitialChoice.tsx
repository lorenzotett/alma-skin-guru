import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Package, MessageCircle } from "lucide-react";

interface InitialChoiceProps {
  userName: string;
  onChoice: (choice: 'analysis' | 'products' | 'questions') => void;
  onBack?: () => void;
}

export const InitialChoice = ({ userName, onChoice, onBack }: InitialChoiceProps) => {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleChoice = async (choice: 'analysis' | 'products' | 'questions') => {
    if (isSelecting) return;
    setIsSelecting(true);
    onChoice(choice);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5ebe0]">
      <Card className="max-w-3xl w-full p-8 space-y-6 shadow-xl bg-[#f9f5f0]/95 backdrop-blur border-primary/20">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            Ciao {userName}! 🌟
          </h2>
          <p className="text-lg text-foreground leading-relaxed">
            Sono la tua Skin Expert di Alma e sono davvero felice di conoscerti! 
            Possiamo analizzare insieme la tua pelle per trovare la skincare routine 
            perfetta che la renderà radiosa e bellissima! ✨
          </p>
          
          <div className="bg-accent/10 p-6 rounded-lg space-y-3 mt-4">
            <p className="font-medium text-foreground">Puoi iniziare l'analisi in due modi:</p>
            <div className="space-y-2 text-sm">
              <p>📸 <strong>Carica una foto del tuo viso</strong> (struccato e con buona luce naturale) per farla analizzare dalla mia tecnologia skin specialist AI</p>
              <p>💬 <strong>Oppure raccontami della tua pelle</strong>: come la vedi, cosa senti, che piccoli problemini hai notato e quali sono le tue abitudini di bellezza!</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Se invece vuoi informazioni sui nostri prodotti, o per qualsiasi dubbio, chiedi pure. Sono qui per te! 😊
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 pt-4">
          <Button
            onClick={() => handleChoice('analysis')}
            variant="default"
            size="lg"
            disabled={isSelecting}
            className="h-auto py-6 flex flex-col gap-3 bg-primary hover:bg-primary/90 font-bold"
          >
            <Sparkles className="w-8 h-8" />
            <div className="text-center">
              <div className="font-bold">Analisi Completa</div>
              <div className="text-xs opacity-90">della Pelle</div>
            </div>
          </Button>

          <Button
            onClick={() => handleChoice('products')}
            variant="outline"
            size="lg"
            disabled={isSelecting}
            className="h-auto py-6 flex flex-col gap-3 border-2 font-bold"
          >
            <Package className="w-8 h-8" />
            <div className="text-center">
              <div className="font-bold">Info Prodotti</div>
              <div className="text-xs">Specifici</div>
            </div>
          </Button>

          <Button
            onClick={() => handleChoice('questions')}
            variant="outline"
            size="lg"
            disabled={isSelecting}
            className="h-auto py-6 flex flex-col gap-3 border-2 font-bold"
          >
            <MessageCircle className="w-8 h-8" />
            <div className="text-center">
              <div className="font-bold">Domande</div>
              <div className="text-xs">Generali</div>
            </div>
          </Button>
        </div>

        {onBack && (
          <div className="pt-4">
            <Button 
              variant="outline"
              size="lg"
              onClick={onBack}
              className="w-full"
            >
              ← Indietro
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};