import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SkinAnalysisResultsProps {
  photoPreview?: string;
  onNext: (scores: SkinScores) => void;
}

export interface SkinScores {
  hydration: number;
  elasticity: number;
  pigmentation: number;
  acne: number;
  wrinkles: number;
  pores: number;
  redness: number;
}

export const SkinAnalysisResults = ({ photoPreview, onNext }: SkinAnalysisResultsProps) => {
  // Simulate AI analysis scores (in production, this would come from an actual analysis)
  const scores: SkinScores = {
    hydration: Math.floor(Math.random() * 30) + 50, // 50-80
    elasticity: Math.floor(Math.random() * 30) + 50,
    pigmentation: Math.floor(Math.random() * 40) + 30, // 30-70
    acne: Math.floor(Math.random() * 50) + 20, // 20-70
    wrinkles: Math.floor(Math.random() * 40) + 30,
    pores: Math.floor(Math.random() * 40) + 40,
    redness: Math.floor(Math.random() * 50) + 20,
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Ottimo";
    if (score >= 40) return "Buono";
    return "Da Migliorare";
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
          <span>🔬</span> Analisi della Pelle Completata
        </h3>
        
        {photoPreview && (
          <div className="relative">
            <img 
              src={photoPreview} 
              alt="Tua foto" 
              className="w-full rounded-lg max-h-48 object-cover"
            />
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Ho analizzato la tua pelle e questi sono i risultati:
        </p>

        <div className="space-y-3">
          {Object.entries(scores).map(([key, value]) => {
            const labels: Record<string, string> = {
              hydration: "💧 Idratazione",
              elasticity: "🎈 Elasticità",
              pigmentation: "🎨 Pigmentazione",
              acne: "🔴 Acne/Imperfezioni",
              wrinkles: "📏 Rughe",
              pores: "⚫ Pori",
              redness: "🌡️ Rossore",
            };

            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{labels[key]}</span>
                  <span className={cn("font-bold", getScoreColor(value))}>
                    {value}/100 - {getScoreLabel(value)}
                  </span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            );
          })}
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-sm">🎯 Aree Prioritarie:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {Object.entries(scores)
              .filter(([_, score]) => score < 50)
              .map(([key, score]) => {
                const labels: Record<string, string> = {
                  hydration: "Idratazione",
                  elasticity: "Elasticità",
                  pigmentation: "Uniformità del tono",
                  acne: "Imperfezioni",
                  wrinkles: "Linee sottili",
                  pores: "Texture della pelle",
                  redness: "Sensibilità",
                };
                return <li key={key}>• {labels[key]}</li>;
              })}
          </ul>
        </div>
      </Card>

      <Button onClick={() => onNext(scores)} size="lg" className="w-full">
        Continua con le Domande ✨
      </Button>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
