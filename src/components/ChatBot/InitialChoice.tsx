import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Package, MessageCircle } from "lucide-react";

interface InitialChoiceProps {
  userName: string;
  onChoice: (choice: 'analysis' | 'products' | 'questions') => void;
}

export const InitialChoice = ({ userName, onChoice }: InitialChoiceProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-3xl w-full p-8 space-y-6 shadow-lg">
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
            onClick={() => onChoice('analysis')}
            variant="default"
            size="lg"
            className="h-auto py-6 flex flex-col gap-3 bg-primary hover:bg-primary/90"
          >
            <Sparkles className="w-8 h-8" />
            <div className="text-center">
              <div className="font-bold">Analisi Completa</div>
              <div className="text-xs opacity-90">della Pelle</div>
            </div>
          </Button>

          <Button
            onClick={() => onChoice('products')}
            variant="outline"
            size="lg"
            className="h-auto py-6 flex flex-col gap-3 border-2"
          >
            <Package className="w-8 h-8" />
            <div className="text-center">
              <div className="font-bold">Info Prodotti</div>
              <div className="text-xs">Specifici</div>
            </div>
          </Button>

          <Button
            onClick={() => onChoice('questions')}
            variant="outline"
            size="lg"
            className="h-auto py-6 flex flex-col gap-3 border-2"
          >
            <MessageCircle className="w-8 h-8" />
            <div className="text-center">
              <div className="font-bold">Domande</div>
              <div className="text-xs">Generali</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};