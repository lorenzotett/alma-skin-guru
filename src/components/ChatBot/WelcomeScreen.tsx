import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Brain, ShoppingBag, ChevronRight, Check } from "lucide-react";
import logoAlma from "@/assets/logo-alma.jpg";
import backgroundTexture from "@/assets/background-texture.png";

interface WelcomeScreenProps {
  onStart: () => void;
  onFeatureClick?: (featureType: 'analysis' | 'questions' | 'products') => void;
}

export const WelcomeScreen = ({ onStart, onFeatureClick }: WelcomeScreenProps) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Sparkles,
      title: "Analisi AI Avanzata",
      description: "Tecnologia all'avanguardia per analizzare la tua pelle",
      color: "from-primary via-[#b55819] to-accent",
      type: 'analysis' as const
    },
    {
      icon: Brain,
      title: "Consulenza Personalizzata",
      description: "Risposte immediate da esperti virtuali",
      color: "from-accent via-[#b55819] to-primary",
      type: 'questions' as const
    },
    {
      icon: ShoppingBag,
      title: "Prodotti 100% Naturali",
      description: "Cosmetici biologici Made in Italy",
      color: "from-primary via-[#b55819] to-accent",
      type: 'products' as const
    }
  ];

  const benefits = [
    "Analisi della pelle in meno di 5 minuti",
    "Routine personalizzata basata sulle tue esigenze",
    "Prodotti naturali certificati",
    "Consulenza AI gratuita 24/7"
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundTexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-24 h-24 sm:w-40 sm:h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 sm:w-48 sm:h-48 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-20 h-20 sm:w-32 sm:h-32 bg-accent/8 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <Card className="max-w-4xl w-full p-6 sm:p-10 md:p-12 text-center space-y-8 sm:space-y-10 shadow-2xl bg-card/95 backdrop-blur-xl border-2 border-primary/20 relative z-10 animate-fade-in">
        {/* Logo with enhanced styling */}
        <div className="flex justify-center mb-4 sm:mb-6 animate-scale-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full animate-pulse"></div>
            <img 
              src={logoAlma} 
              alt="Alma Natural Beauty" 
              className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 object-contain drop-shadow-2xl rounded-full ring-4 ring-white/50 group-hover:scale-105 transition-transform"
            />
          </div>
        </div>
        
        {/* Enhanced title section */}
        <div className="space-y-4 px-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-[#b55819] to-accent bg-clip-text text-transparent leading-tight animate-fade-in">
            Analisi Pelle AI
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary animate-fade-in" style={{ animationDelay: '0.3s' }}>
            by Alma Natural Beauty
          </p>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Scopri la tua skincare routine personalizzata in pochi minuti grazie all'intelligenza artificiale
          </p>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 py-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          {features.map((feature, index) => (
            <div 
              key={index}
              onClick={() => onFeatureClick?.(feature.type)}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              className="relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-white to-white/80 border-2 border-primary/20 shadow-lg hover:shadow-2xl hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:-translate-y-2 cursor-pointer group"
            >
              <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-xl ring-4 ring-white/50 group-hover:ring-8 group-hover:ring-primary/20 transition-all ${hoveredFeature === index ? 'scale-110' : ''}`}>
                <feature.icon className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-base sm:text-lg text-primary group-hover:text-primary/80">{feature.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">{feature.description}</p>
              </div>
              {hoveredFeature === index && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Benefits List */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-lg font-bold text-primary mb-4">✨ Cosa Ottieni:</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-left">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-muted-foreground font-medium group-hover:text-primary transition-colors">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced CTA */}
        <div className="pt-6 space-y-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <Button 
            onClick={onStart}
            size="lg"
            className="group relative text-lg px-12 py-7 sm:px-14 sm:py-8 bg-gradient-to-r from-primary via-[#b55819] to-accent hover:from-primary/90 hover:via-[#b55819]/90 hover:to-accent/90 text-white shadow-2xl hover:shadow-[0_20px_50px_rgba(154,74,19,0.4)] transition-all hover:scale-110 w-full sm:w-auto rounded-full font-bold overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            <Sparkles className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
            <span className="relative">Inizia Subito l'Analisi</span>
            <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-xs text-muted-foreground">
            ⚡ Richiede solo <span className="font-bold text-primary">3-5 minuti</span>
          </p>
        </div>

        {/* Social Proof */}
        <div className="pt-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-full hover:border-green-500/50 transition-all">
            <p className="text-sm font-semibold text-green-700">
              🎁 <span className="font-bold">Analisi gratuita</span> • Nessun impegno richiesto
            </p>
          </div>
        </div>

        {/* Trust badges enhanced */}
        <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm animate-fade-in" style={{ animationDelay: '0.9s' }}>
          {["100% Naturale", "Cruelty Free", "Made in Italy"].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/10 hover:border-primary/30 hover:bg-card/80 transition-all group">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-muted-foreground font-medium group-hover:text-primary transition-colors">{badge}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
