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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNext(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5ebe0]">
      <Card className="max-w-xl w-full p-8 space-y-6 shadow-xl bg-[#f9f5f0]/95 backdrop-blur border-primary/20">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            Benvenuta! 🌸
          </h2>
          <p className="text-lg text-foreground">
            Come ti chiami?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Il tuo nome..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg p-6"
            autoFocus
          />
          
          <div className="flex gap-2">
            {onBack && (
              <Button 
                type="button"
                variant="outline"
                size="lg"
                onClick={onBack}
              >
                ← Indietro
              </Button>
            )}
            <Button 
              type="submit" 
              size="lg" 
              className="flex-1"
              disabled={!name.trim()}
            >
              Continua
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};