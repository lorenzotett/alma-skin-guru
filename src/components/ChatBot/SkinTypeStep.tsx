import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SkinType = "secca" | "grassa" | "mista" | "normale" | "asfittica";

interface SkinTypeStepProps {
  onNext: (skinType: SkinType) => void;
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
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-3xl w-full p-8 space-y-6 shadow-lg">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-primary">
            Che tipo di pelle hai?
          </h2>
          <p className="text-muted-foreground">
            Seleziona quella che descrive meglio la tua pelle
          </p>
        </div>

        <div className="grid gap-4">
          {skinTypes.map((type) => (
            <Button
              key={type.value}
              onClick={() => onNext(type.value)}
              variant="outline"
              className={cn(
                "h-auto p-6 justify-start text-left hover:bg-accent/20 hover:border-primary transition-all",
                "border-2"
              )}
            >
              <div className="flex items-start gap-4 w-full">
                <span className="text-4xl">{type.icon}</span>
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-lg text-foreground">{type.title}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};