import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Concern = 
  | "rossori"
  | "acne"
  | "rughe"
  | "pigmentazione"
  | "pori_dilatati"
  | "oleosita"
  | "danni_solari"
  | "occhiaie"
  | "disidratazione"
  | "elasticita"
  | "texture"
  | "nessuna";

interface ConcernsStepProps {
  onNext: (concerns: Concern[]) => void;
  onBack?: () => void;
}

const concerns = [
  { value: "rossori" as Concern, icon: "🔴", title: "Rossori", description: "Arrossamenti, couperose, pelle reattiva" },
  { value: "acne" as Concern, icon: "🔴", title: "Acne", description: "Brufoli attivi, pelle a tendenza acneica" },
  { value: "rughe" as Concern, icon: "📏", title: "Rughe", description: "Segni di invecchiamento, linee d'espressione" },
  { value: "pigmentazione" as Concern, icon: "🟤", title: "Pigmentazione/Macchie", description: "Macchie scure, discromie, melasma" },
  { value: "pori_dilatati" as Concern, icon: "🔍", title: "Pori dilatati", description: "Pori molto visibili e dilatati" },
  { value: "oleosita" as Concern, icon: "💦", title: "Oleosità/Eccesso sebo", description: "Pelle lucida, produzione eccessiva di sebo" },
  { value: "danni_solari" as Concern, icon: "☀️", title: "Danni solari", description: "Macchie solari, fotoinvecchiamento" },
  { value: "occhiaie" as Concern, icon: "👁️", title: "Occhiaie", description: "Occhiaie scure, borse sotto gli occhi" },
  { value: "disidratazione" as Concern, icon: "💧", title: "Disidratazione", description: "Pelle secca, che tira, manca di idratazione" },
  { value: "elasticita" as Concern, icon: "⬇️", title: "Perdita elasticità/tono", description: "Pelle cadente, poco tonica" },
  { value: "texture" as Concern, icon: "📐", title: "Texture non uniforme", description: "Pelle ruvida, irregolare" },
  { value: "nessuna" as Concern, icon: "☑️", title: "Nessuna problematica particolare", description: "" }
];

export const ConcernsStep = ({ onNext, onBack }: ConcernsStepProps) => {
  const [selected, setSelected] = useState<Concern[]>([]);

  const toggleConcern = (concern: Concern) => {
    if (concern === "nessuna") {
      setSelected(selected.includes("nessuna") ? [] : ["nessuna"]);
    } else {
      setSelected(prev => {
        const filtered = prev.filter(c => c !== "nessuna");
        return filtered.includes(concern)
          ? filtered.filter(c => c !== concern)
          : [...filtered, concern];
      });
    }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-[#f9f5f0]/95 backdrop-blur border-primary/20 shadow-lg">
      <div className="space-y-1.5 sm:space-y-2">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-primary">Quali sono le tue preoccupazioni? 💭</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Seleziona le tue problematiche (anche più di una):
        </p>
      </div>

      <div className="grid gap-2 max-h-[50vh] sm:max-h-[400px] overflow-y-auto pr-1">
        {concerns.map((concern) => (
          <div
            key={concern.value}
            onClick={() => toggleConcern(concern.value)}
            className={cn(
              "flex items-start gap-2 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all bg-card/50",
              "hover:bg-primary/10 hover:border-primary hover:shadow-md active:scale-[0.98]",
              selected.includes(concern.value) && "bg-primary/15 border-primary shadow-md"
            )}
          >
            <Checkbox
              checked={selected.includes(concern.value)}
              className="mt-0.5 pointer-events-none"
            />
            <div className="flex-1">
              <div className="font-medium flex items-center gap-1.5 text-xs sm:text-sm text-foreground">
                <span className="text-sm sm:text-base">{concern.icon}</span>
                <span>{concern.title}</span>
              </div>
              {concern.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {concern.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="w-32"
          >
            ← Indietro
          </Button>
        )}
        <Button
          onClick={() => onNext(selected)}
          className="flex-1 text-sm sm:text-base"
          size="lg"
          disabled={selected.length === 0}
        >
          Continua ({selected.length})
        </Button>
      </div>
    </Card>
  );
};