import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AgeStepProps {
  onNext: (age: number, ageDisplay?: string) => void;
  onBack?: () => void;
}

const ageRanges = [
  { label: "16-25 anni", value: 20 },
  { label: "26-35 anni", value: 30 },
  { label: "36-45 anni", value: 40 },
  { label: "46-60 anni", value: 53 },
  { label: "60+ anni", value: 65 }
];

export const AgeStep = ({ onNext, onBack }: AgeStepProps) => {
  const [customAge, setCustomAge] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAgeSelect = (age: number, display?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onNext(age, display);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const age = parseInt(customAge);
    if (age > 0 && age < 120 && !isSubmitting) {
      setIsSubmitting(true);
      onNext(age);
    }
  };

  return (
    <Card className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 bg-[#f9f5f0]/95 backdrop-blur border-primary/20 shadow-lg">
      <div className="space-y-1.5 sm:space-y-2">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-primary">Qual è la tua età? 🎂</h3>
        <p className="text-xs sm:text-sm md:text-base text-foreground font-bold">Seleziona la tua fascia d'età:</p>
      </div>

      {!showCustom ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {ageRanges.map((range) => (
              <Button
                key={range.label}
                onClick={() => handleAgeSelect(range.value, range.label)}
                variant="outline"
                disabled={isSubmitting}
                className="hover:bg-primary/10 hover:border-primary hover:shadow-md bg-card/50 text-xs sm:text-sm md:text-base font-bold h-auto py-3 sm:py-4"
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <Button
              variant="link"
              onClick={() => setShowCustom(true)}
              disabled={isSubmitting}
              className="text-primary text-[10px] sm:text-xs md:text-sm w-full font-bold"
            >
              Inserisci età manualmente
            </Button>
            
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                className="w-full text-xs sm:text-sm md:text-base font-bold"
              >
                ← Indietro
              </Button>
            )}
          </div>
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
              disabled={isSubmitting}
              className="text-sm sm:text-base font-semibold"
            />
            <Button 
              type="submit" 
              disabled={!customAge || isSubmitting}
              className="text-xs sm:text-sm font-bold"
            >
              {isSubmitting ? '...' : 'OK'}
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowCustom(false)}
            size="sm"
            disabled={isSubmitting}
            className="w-full text-[10px] sm:text-xs font-bold"
          >
            ← Torna alle fasce
          </Button>
        </form>
      )}
    </Card>
  );
};