import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ProductType = 
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
  onNext: (productType: ProductType) => void;
}

const productTypes = [
  { value: "routine_completa" as ProductType, label: "✨ Routine Completa", recommended: true },
  { value: "detergente" as ProductType, label: "🧴 Detergente/Struccante" },
  { value: "tonico" as ProductType, label: "💧 Tonico Viso" },
  { value: "siero" as ProductType, label: "✨ Siero/Trattamento Specifico" },
  { value: "crema" as ProductType, label: "🌸 Crema Viso" },
  { value: "crema_mani_piedi" as ProductType, label: "🤲 Crema Mani e Piedi" },
  { value: "protezione_solare" as ProductType, label: "☀️ Protezione Solare" },
  { value: "contorno_occhi" as ProductType, label: "👁️ Contorno Occhi" },
  { value: "maschera" as ProductType, label: "🎭 Maschera Viso" },
  { value: "prodotti_corpo" as ProductType, label: "🧴 Prodotti Corpo" },
  { value: "olio_corpo" as ProductType, label: "💆 Olio Corpo" }
];

export const ProductTypeStep = ({ onNext }: ProductTypeStepProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-3xl w-full p-8 space-y-6 shadow-lg">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-primary">
            Vuoi che ti consigli una routine completa o cerchi un tipo di prodotto in particolare?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {productTypes.map((type) => (
            <Button
              key={type.value}
              onClick={() => onNext(type.value)}
              variant={type.recommended ? "default" : "outline"}
              size="lg"
              className={type.recommended ? "border-2 border-primary/30" : "border-2"}
            >
              {type.label}
              {type.recommended && <span className="ml-2 text-xs">(consigliato)</span>}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};