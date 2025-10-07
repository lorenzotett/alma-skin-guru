import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoAlma from "@/assets/logo-alma.jpg";

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-[#f5ebe0]">
      <Card className="max-w-2xl w-full p-4 sm:p-6 md:p-8 lg:p-12 text-center space-y-4 sm:space-y-6 md:space-y-8 shadow-xl bg-[#f9f5f0]/95 backdrop-blur border-primary/20">
        <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
          <img 
            src={logoAlma} 
            alt="Alma Natural Beauty" 
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain drop-shadow-lg"
          />
        </div>
        
        <div className="space-y-2 sm:space-y-3 md:space-y-4 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary leading-tight">
            Analisi Pelle AI by Alma Natural Beauty
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Scopri la skincare routine perfetta per la tua pelle
          </p>
        </div>

        <div className="pt-3 sm:pt-4 md:pt-6">
          <Button 
            onClick={onStart}
            size="lg"
            className="text-sm sm:text-base md:text-lg px-6 py-5 sm:px-8 sm:py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
          >
            Inizia l'Analisi ✨
          </Button>
        </div>
      </Card>
    </div>
  );
};