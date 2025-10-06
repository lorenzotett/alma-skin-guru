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
    <Card className="p-4 space-y-3">
      <div className="grid gap-2">
        {skinTypes.map((type) => (
          <Button
            key={type.value}
            onClick={() => onNext(type.value)}
            variant="outline"
            className={cn(
              "h-auto p-4 justify-start text-left hover:bg-accent/20 hover:border-primary transition-all"
            )}
          >
            <div className="flex items-start gap-3 w-full">
              <span className="text-2xl">{type.icon}</span>
              <div className="flex-1 space-y-0.5">
                <div className="font-bold text-sm text-foreground">{type.title}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};