import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Brain, ShoppingBag } from "lucide-react";
import logoAlma from "@/assets/logo-alma.jpg";

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-[#9a4a13] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 sm:w-40 sm:h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-64 sm:h-64 bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <Card className="max-w-3xl w-full p-6 sm:p-8 md:p-10 lg:p-12 text-center space-y-6 sm:space-y-8 shadow-2xl bg-[#f9f5f0]/95 backdrop-blur-xl border-primary/20 relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6 animate-scale-in">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl"></div>
            <img 
              src={logoAlma} 
              alt="Alma Natural Beauty" 
              className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain drop-shadow-2xl rounded-full"
            />
          </div>
        </div>
        
        {/* Title with gradient */}
        <div className="space-y-3 sm:space-y-4 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-tight animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Analisi Pelle AI
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-semibold text-primary animate-fade-in" style={{ animationDelay: '0.3s' }}>
            by Alma Natural Beauty
          </p>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Scopri la tua skincare routine personalizzata con l'intelligenza artificiale
          </p>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 py-4 sm:py-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent hover:from-primary/20 transition-all hover:scale-105">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm sm:text-base text-primary">Analisi AI</p>
              <p className="text-xs text-muted-foreground">Tecnologia avanzata</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-transparent hover:from-accent/20 transition-all hover:scale-105">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm sm:text-base text-primary">Consulenza AI</p>
              <p className="text-xs text-muted-foreground">Risposte immediate</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent hover:from-primary/20 transition-all hover:scale-105">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm sm:text-base text-primary">Prodotti Naturali</p>
              <p className="text-xs text-muted-foreground">Made in Italy</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4 sm:pt-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button 
            onClick={onStart}
            size="lg"
            className="text-base sm:text-lg px-8 py-6 sm:px-10 sm:py-7 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 w-full sm:w-auto rounded-full font-bold"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Inizia l'Analisi ✨
          </Button>
        </div>

        {/* Discount Badge */}
        <div className="pt-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-full">
            <p className="text-xs sm:text-sm font-semibold text-green-700">
              🎁 Ricevi subito il codice sconto <span className="font-bold">15% (ALMA15)</span>
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4 text-xs sm:text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>100% Naturale</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Cruelty Free</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Made in Italy</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
