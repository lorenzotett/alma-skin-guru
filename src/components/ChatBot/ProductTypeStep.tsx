import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductType = 
  | "routine_completa"
  | "detergente"
  | "tonico"
  | "siero"
  | "crema"
  | "crema_mani_piedi"
  | "protezione_solare"
  | "contorno_occhi"
  | "maschera"
  | "prodotti_corpo"
  | "olio_corpo";

interface ProductTypeStepProps {
  onNext: (productTypes: ProductType[]) => void;
}

const productTypes = [
  { value: "routine_completa" as ProductType, label: "✨ Routine Completa", recommended: true },
  { value: "detergente" as ProductType, label: "🧴 Detergente/Struccante" },
  { value: "tonico" as ProductType, label: "💧 Tonico Viso" },
  { value: "siero" as ProductType, label: "✨ Siero/Trattamento Specifico" },
  { value: "crema" as ProductType, label: "🌸 Crema Viso" },
  { value: "crema_mani_piedi" as ProductType, label: "🤲 Crema Mani e Piedi", unavailable: true },
  { value: "protezione_solare" as ProductType, label: "☀️ Protezione Solare" },
  { value: "contorno_occhi" as ProductType, label: "👁️ Contorno Occhi" },
  { value: "maschera" as ProductType, label: "🎭 Maschera Viso" },
  { value: "prodotti_corpo" as ProductType, label: "🧴 Prodotti Corpo" },
  { value: "olio_corpo" as ProductType, label: "💆 Olio Corpo" }
];

export const ProductTypeStep = ({ onNext }: ProductTypeStepProps) => {
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);

  const toggleType = (type: ProductType) => {
    // Routine completa is exclusive
    if (type === "routine_completa") {
      setSelectedTypes(["routine_completa"]);
    } else {
      setSelectedTypes(prev => {
        // Remove routine_completa if selecting individual products
        const filtered = prev.filter(t => t !== "routine_completa");
        
        if (filtered.includes(type)) {
          return filtered.filter(t => t !== type);
        } else {
          return [...filtered, type];
        }
      });
    }
  };

  const handleContinue = () => {
    if (selectedTypes.length > 0) {
      onNext(selectedTypes);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6 space-y-4 bg-[#f9f5f0]/95 backdrop-blur border-primary/20 shadow-lg">
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-primary">
            Che tipo di prodotti ti interessano? 🎯
          </h3>
          <p className="text-sm text-muted-foreground">
            Seleziona una routine completa oppure scegli i prodotti specifici che cerchi. Puoi selezionarne più di uno!
          </p>
        </div>

        {/* Routine Completa - Featured */}
        <div className="mb-4">
          <button
            onClick={() => toggleType("routine_completa")}
            className={cn(
              "w-full relative p-6 rounded-xl border-3 text-left transition-all",
              "hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl",
              "bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20",
              selectedTypes.includes("routine_completa")
                ? "border-primary shadow-lg ring-2 ring-primary/50"
                : "border-primary/40 hover:border-primary"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✨</span>
                  <span className="font-bold text-lg text-primary">Routine Completa</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  La scelta migliore! Ricevi una skincare routine personalizzata e completa per la tua pelle.
                </p>
                <Badge className="bg-primary text-primary-foreground">
                  🌟 Più Consigliato
                </Badge>
              </div>
              {selectedTypes.includes("routine_completa") && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground mb-3">
          oppure seleziona prodotti specifici:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {productTypes.filter(t => t.value !== "routine_completa").map((type) => {
            const isSelected = selectedTypes.includes(type.value);
            const isRoutineSelected = selectedTypes.includes("routine_completa");
            const isDisabled = isRoutineSelected;
            const isUnavailable = (type as any).unavailable;

            if (isUnavailable) {
              return (
                <div
                  key={type.value}
                  className="relative p-4 rounded-lg border-2 text-left opacity-60 bg-muted/30 border-border cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm text-muted-foreground">{type.label}</span>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs bg-muted">
                    Non disponibile
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Al momento non disponibile. Ti informeremo quando sarà in gamma.
                  </p>
                </div>
              );
            }

            return (
              <button
                key={type.value}
                onClick={() => toggleType(type.value)}
                disabled={isDisabled}
                className={cn(
                  "relative p-4 rounded-lg border-2 text-left transition-all bg-card/50",
                  "hover:scale-[1.02] active:scale-[0.98] hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm">{type.label}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedTypes.length > 0 && (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-2">
              Hai selezionato: <span className="font-medium text-foreground">{selectedTypes.length}</span> {selectedTypes.length === 1 ? "prodotto" : "prodotti"}
            </p>
            <Button onClick={handleContinue} size="lg" className="w-full bg-primary hover:bg-primary/90">
              Continua ✨
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};