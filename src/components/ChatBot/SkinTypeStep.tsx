import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SkinType = "secca" | "grassa" | "mista" | "normale" | "asfittica";

interface SkinTypeStepProps {
  onNext: (skinTypes: SkinType[]) => void;
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

export const SkinTypeStep = ({ onNext }: SkinTypeStepProps) => {
  const [selectedTypes, setSelectedTypes] = useState<SkinType[]>([]);

  const toggleType = (type: SkinType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleContinue = () => {
    if (selectedTypes.length > 0) {
      onNext(selectedTypes);
    }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4 bg-[#f9f5f0]/95 backdrop-blur border-primary/20 shadow-lg">
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold text-primary">Che tipo di pelle hai? 🌸</h3>
        <p className="text-sm text-muted-foreground">Puoi selezionare più opzioni se la tua pelle ha caratteristiche diverse:</p>
      </div>
      <div className="grid gap-2 sm:gap-3">
        {skinTypes.map((type) => {
          const isSelected = selectedTypes.includes(type.value);
          return (
            <button
              key={type.value}
              onClick={() => toggleType(type.value)}
              className={cn(
                "h-auto p-4 justify-start text-left transition-all border-2 rounded-lg bg-card/50",
                "hover:scale-[1.02] active:scale-[0.98] hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-3 w-full">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="font-bold text-sm text-foreground">{type.title}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedTypes.length > 0 && (
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-2">
            Hai selezionato: <span className="font-medium text-foreground">{selectedTypes.length}</span> {selectedTypes.length === 1 ? "tipo" : "tipi"}
          </p>
          <Button onClick={handleContinue} size="lg" className="w-full bg-primary hover:bg-primary/90">
            Continua ✨
          </Button>
        </div>
      )}
    </Card>
  );
};