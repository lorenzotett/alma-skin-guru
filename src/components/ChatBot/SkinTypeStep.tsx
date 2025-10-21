import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SkinType = "secca" | "grassa" | "mista" | "normale" | "asfittica";

interface SkinTypeStepProps {
  onNext: (skinTypes: SkinType[]) => void;
  onBack?: () => void;
}

const skinTypes = [
  {
    value: "secca" as SkinType,
    icon: "🌵",
    title: "SECCA",
    description: "La mia pelle tira, si desquama facilmente e manca di luminosità"
  },
  {
    value: "grassa" as SkinType,
    icon: "💧",
    title: "GRASSA",
    description: "La mia pelle è lucida, con pori visibili e tendenza ai brufoli"
  },
  {
    value: "mista" as SkinType,
    icon: "⚖️",
    title: "MISTA",
    description: "Zona T (fronte, naso, mento) grassa, guance normali o secche"
  },
  {
    value: "normale" as SkinType,
    icon: "✨",
    title: "NORMALE",
    description: "La mia pelle è equilibrata, senza particolari problemi"
  },
  {
    value: "asfittica" as SkinType,
    icon: "🔒",
    title: "ASFITTICA",
    description: "La mia pelle è spenta, opaca, con pori ostruiti"
  }
];

export const SkinTypeStep = ({ onNext, onBack }: SkinTypeStepProps) => {
  const [selectedTypes, setSelectedTypes] = useState<SkinType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleType = (type: SkinType) => {
    if (isSubmitting) return;
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleContinue = () => {
    if (selectedTypes.length > 0 && !isSubmitting) {
      setIsSubmitting(true);
      onNext(selectedTypes);
    }
  };

  return (
    <Card className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 bg-[#f9f5f0]/95 backdrop-blur border-primary/20 shadow-lg">
      <div className="space-y-1.5 sm:space-y-2">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-primary">Che tipo di pelle hai? 🌸</h3>
        <p className="text-xs sm:text-sm md:text-base text-foreground font-bold">Puoi selezionare più opzioni se la tua pelle ha caratteristiche diverse:</p>
      </div>
      <div className="grid gap-2 sm:gap-3">
        {skinTypes.map((type) => {
          const isSelected = selectedTypes.includes(type.value);
          return (
            <button
              key={type.value}
              onClick={() => toggleType(type.value)}
              disabled={isSubmitting}
              className={cn(
                "h-auto p-3 sm:p-4 justify-start text-left transition-all border-2 rounded-lg bg-card/50",
                "hover:scale-[1.02] active:scale-[0.98] hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-2 sm:gap-3 w-full">
                <span className="text-xl sm:text-2xl">{type.icon}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="font-extrabold text-xs sm:text-sm md:text-base text-foreground">{type.title}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-foreground/80 font-semibold">{type.description}</div>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedTypes.length > 0 && (
        <div className="pt-2 space-y-2">
          <p className="text-xs sm:text-sm md:text-base text-foreground font-bold mb-2">
            Hai selezionato: <span className="font-extrabold text-primary">{selectedTypes.length}</span> {selectedTypes.length === 1 ? "tipo" : "tipi"}
          </p>
          <div className="flex gap-2">
            {onBack && (
              <Button 
                onClick={onBack} 
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                className="w-24 sm:w-32 text-xs sm:text-sm md:text-base font-bold"
              >
                ← Indietro
              </Button>
            )}
            <Button 
              onClick={handleContinue} 
              size="lg" 
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90 text-xs sm:text-sm md:text-base font-bold"
            >
              {isSubmitting ? 'Invio...' : 'Continua ✨'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};