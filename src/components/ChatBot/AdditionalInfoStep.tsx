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
    <Card className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Vuoi aggiungere altre info? (opzionale)
      </p>
      <p className="text-xs text-muted-foreground">
        Ad es: allergie, prodotti già provati, risultati desiderati...
      </p>

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