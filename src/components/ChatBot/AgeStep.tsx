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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-2xl w-full p-8 space-y-6 shadow-lg">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-primary">
            Quanti anni hai?
          </h2>
          <p className="text-muted-foreground">
            L'età ci aiuta a consigliarti i prodotti più adatti
          </p>
        </div>

        {!showCustom ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ageRanges.map((range) => (
                <Button
                  key={range.label}
                  onClick={() => onNext(range.value)}
                  variant="outline"
                  size="lg"
                  className="h-auto py-4 border-2 hover:bg-accent/20 hover:border-primary"
                >
                  {range.label}
                </Button>
              ))}
            </div>
            
            <div className="pt-4 text-center">
              <Button
                variant="link"
                onClick={() => setShowCustom(true)}
                className="text-primary"
              >
                Inserisci età manualmente
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Età..."
                value={customAge}
                onChange={(e) => setCustomAge(e.target.value)}
                min="1"
                max="120"
                className="text-lg p-6"
                autoFocus
              />
              <Button type="submit" size="lg" disabled={!customAge}>
                Continua
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowCustom(false)}
              className="w-full"
            >
              ← Torna alle fasce d'età
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};