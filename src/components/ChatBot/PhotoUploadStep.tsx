import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadStepProps {
  onNext: (photo?: File) => void;
  onBack?: () => void;
}

export const PhotoUploadStep = ({ onNext, onBack }: PhotoUploadStepProps) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File troppo grande",
          description: "La foto deve essere inferiore a 10MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato non valido",
          description: "Carica un'immagine (JPG, PNG, HEIC)",
          variant: "destructive"
        });
        return;
      }

      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleRemove = () => {
    setPhoto(null);
    setPreview("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5ebe0]">
      <Card className="max-w-2xl w-full p-8 space-y-6 shadow-xl bg-[#f9f5f0]/95 backdrop-blur border-primary/20">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            Carica una Foto (Opzionale) 📸
          </h2>
          <p className="text-foreground">
            Per poterti consigliare al meglio, puoi caricare una foto del tuo viso oppure passare direttamente alle domande sulla tua pelle.
          </p>
        </div>

        {!preview ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4 bg-secondary/30">
            <Camera className="w-16 h-16 mx-auto text-primary/60" />
            <div>
              <p className="font-medium text-foreground mb-2">
                Trascina qui la tua foto o clicca per selezionarla
              </p>
              <p className="text-sm text-muted-foreground">
                Assicurati che il viso sia struccato, ben illuminato con luce naturale e centrato
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Formati: JPG, JPEG, PNG, HEIC (max 10MB)
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <Button asChild variant="outline" size="lg">
                <span className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Seleziona Foto
                </span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full rounded-lg shadow-md max-h-96 object-contain bg-secondary/30"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-center text-green-600 font-medium">
              ✓ Perfetto! Foto ricevuta
            </p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
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
            onClick={() => onNext(photo || undefined)}
            size="lg"
            className="flex-1"
          >
            {photo ? "Continua con la Foto" : "⏭️ Salta questo passaggio"}
          </Button>
        </div>

        {photo && (
          <p className="text-sm text-center text-muted-foreground">
            Ora passiamo ad alcune domande per conoscerti meglio!
          </p>
        )}
      </Card>
    </div>
  );
};