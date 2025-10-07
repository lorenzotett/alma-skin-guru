import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface AdditionalInfoStepProps {
  onNext: (info?: string) => void;
}

export const AdditionalInfoStep = ({ onNext }: AdditionalInfoStepProps) => {
  const [info, setInfo] = useState("");

  return (
    <Card className="p-4 sm:p-6 space-y-4 bg-[#f9f5f0]/95 backdrop-blur border-primary/20 shadow-lg">
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold text-primary">Altre informazioni? 📝</h3>
        <p className="text-sm text-muted-foreground">
          Vuoi aggiungere altre info? (opzionale)
        </p>
        <p className="text-xs text-muted-foreground">
          Ad es: allergie, prodotti già provati, risultati desiderati...
        </p>
      </div>

      <Textarea
        placeholder="Scrivi qui..."
        value={info}
        onChange={(e) => setInfo(e.target.value)}
        className="min-h-[100px]"
      />

      <Button
        onClick={() => onNext(info || undefined)}
        className="w-full"
      >
        {info ? "Invia ✨" : "Salta ⏭️"}
      </Button>
    </Card>
  );
};