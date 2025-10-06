import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoAlma from "@/assets/logo-alma.jpg";

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <img 
            src={logoAlma} 
            alt="Alma Natural Beauty" 
            className="w-48 h-48 object-contain"
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Analisi Pelle AI by Alma Natural Beauty
          </h1>
          <p className="text-xl text-muted-foreground">
            Scopri la skincare routine perfetta per la tua pelle
          </p>
        </div>

        <div className="pt-6">
          <Button 
            onClick={onStart}
            size="lg"
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
          >
            Inizia l'Analisi ✨
          </Button>
        </div>
      </Card>
    </div>
  );
};