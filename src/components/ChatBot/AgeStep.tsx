import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AgeStepProps {
  onNext: (age: number) => void;
}

const ageRanges = [
  { label: "16-25 anni", value: 20 },
  { label: "26-35 anni", value: 30 },
  { label: "36-45 anni", value: 40 },
  { label: "46-60 anni", value: 53 },
  { label: "60+ anni", value: 65 }
];

export const AgeStep = ({ onNext }: AgeStepProps) => {
  const [customAge, setCustomAge] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const age = parseInt(customAge);
    if (age > 0 && age < 120) {
      onNext(age);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground">Seleziona la tua fascia d'età:</p>

      {!showCustom ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {ageRanges.map((range) => (
              <Button
                key={range.label}
                onClick={() => onNext(range.value)}
                variant="outline"
                className="hover:bg-accent/20 hover:border-primary"
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <Button
            variant="link"
            onClick={() => setShowCustom(true)}
            className="text-primary text-xs w-full"
          >
            Inserisci età manualmente
          </Button>
        </>
      ) : (
        <form onSubmit={handleCustomSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Età..."
              value={customAge}
              onChange={(e) => setCustomAge(e.target.value)}
              min="1"
              max="120"
              autoFocus
            />
            <Button type="submit" disabled={!customAge}>
              OK
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowCustom(false)}
            size="sm"
            className="w-full text-xs"
          >
            ← Torna alle fasce
          </Button>
        </form>
      )}
    </Card>
  );
};