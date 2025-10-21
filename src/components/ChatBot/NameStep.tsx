import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface NameStepProps {
  onNext: (name: string) => void;
  onBack?: () => void;
}

export const NameStep = ({ onNext, onBack }: NameStepProps) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      onNext(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-[#f5ebe0]">
      <Card className="max-w-xl w-full p-6 sm:p-8 space-y-4 sm:space-y-6 shadow-xl bg-[#f9f5f0]/95 backdrop-blur border-primary/20">
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary">
            Benvenuta! 🌸
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-foreground font-bold">
            Come ti chiami?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <Input
            type="text"
            placeholder="Il tuo nome..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-base sm:text-lg md:text-xl p-4 sm:p-5 md:p-6 font-semibold"
            autoFocus
            disabled={isSubmitting}
          />
          
          <div className="flex gap-2">
            {onBack && (
              <Button 
                type="button"
                variant="outline"
                size="lg"
                onClick={onBack}
                disabled={isSubmitting}
                className="text-sm sm:text-base font-bold"
              >
                ← Indietro
              </Button>
            )}
            <Button 
              type="submit" 
              size="lg" 
              className="flex-1 text-sm sm:text-base md:text-lg font-bold"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Invio...' : 'Continua'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};