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

export const ConcernsStep = ({ onNext }: ConcernsStepProps) => {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-4xl w-full p-8 space-y-6 shadow-lg">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-primary">
            Quali problematiche ha la tua pelle?
          </h2>
          <p className="text-muted-foreground">
            Puoi selezionarne anche più di una
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {concerns.map((concern) => (
            <div
              key={concern.value}
              onClick={() => toggleConcern(concern.value)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                "hover:bg-accent/20 hover:border-primary",
                selected.includes(concern.value) && "bg-accent/20 border-primary"
              )}
            >
              <Checkbox
                checked={selected.includes(concern.value)}
                onCheckedChange={() => toggleConcern(concern.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2 text-foreground">
                  <span>{concern.icon}</span>
                  <span>{concern.title}</span>
                </div>
                {concern.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {concern.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => onNext(selected)}
          size="lg"
          className="w-full"
          disabled={selected.length === 0}
        >
          Continua ({selected.length} {selected.length === 1 ? "selezionata" : "selezionate"})
        </Button>
      </Card>
    </div>
  );
};