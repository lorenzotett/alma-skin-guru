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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-2xl w-full p-8 space-y-6 shadow-lg">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-primary">
            Hai altre informazioni che vorresti darmi?
          </h2>
          <p className="text-muted-foreground">
            In modo da poterti aiutare al meglio (opzionale)
          </p>
        </div>

        <Textarea
          placeholder="Ad esempio: allergie, prodotti che hai già provato, risultati che vorresti ottenere..."
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          className="min-h-[150px] text-base"
        />

        <div className="flex gap-4">
          <Button
            onClick={() => onNext(info || undefined)}
            size="lg"
            className="flex-1"
          >
            {info ? "Invia" : "⏭️ Passa ai risultati"}
          </Button>
        </div>
      </Card>
    </div>
  );
};