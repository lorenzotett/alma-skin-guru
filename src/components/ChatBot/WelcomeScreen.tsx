import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Brain, ShoppingBag } from "lucide-react";
import logoAlma from "@/assets/logo-alma.jpg";

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-[#f5ebe0] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 sm:w-40 sm:h-40 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-64 sm:h-64 bg-primary/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <Card className="max-w-3xl w-full p-6 sm:p-8 md:p-10 lg:p-12 text-center space-y-6 sm:space-y-8 shadow-2xl bg-[#f5ebe0] backdrop-blur-xl border-primary/20 relative z-10 animate-fade-in">
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
          <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border-2 border-primary/30 shadow-[0_8px_30px_rgb(154,74,19,0.15)] hover:shadow-[0_12px_40px_rgb(154,74,19,0.25)] hover:border-primary/50 transition-all hover:scale-105 hover:-translate-y-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary via-[#b55819] to-accent flex items-center justify-center shadow-lg ring-4 ring-primary/10">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-base sm:text-lg text-primary mb-1">Analisi AI</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Tecnologia avanzata</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border-2 border-accent/30 shadow-[0_8px_30px_rgb(154,74,19,0.15)] hover:shadow-[0_12px_40px_rgb(154,74,19,0.25)] hover:border-accent/50 transition-all hover:scale-105 hover:-translate-y-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-accent via-[#b55819] to-primary flex items-center justify-center shadow-lg ring-4 ring-accent/10">
              <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-base sm:text-lg text-primary mb-1">Consulenza AI</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Risposte immediate</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border-2 border-primary/30 shadow-[0_8px_30px_rgb(154,74,19,0.15)] hover:shadow-[0_12px_40px_rgb(154,74,19,0.25)] hover:border-primary/50 transition-all hover:scale-105 hover:-translate-y-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary via-[#b55819] to-accent flex items-center justify-center shadow-lg ring-4 ring-primary/10">
              <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-base sm:text-lg text-primary mb-1">Prodotti Naturali</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Made in Italy</p>
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

        {/* Benefit Badge */}
        <div className="pt-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-full">
            <p className="text-xs sm:text-sm font-semibold text-green-700">
              🎁 Ricevi la tua <span className="font-bold">analisi personalizzata gratuita</span>
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
