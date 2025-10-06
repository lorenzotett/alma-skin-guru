import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SkinAnalysisResultsProps {
  photoPreview?: string;
  onNext: (scores: SkinScores) => void;
}

export interface SkinScores {
  idratazione: number;
  elasticita: number;
  pigmentazione: number;
  acne: number;
  rughe: number;
  pori: number;
  rossore: number;
}

export const SkinAnalysisResults = ({ photoPreview, onNext }: SkinAnalysisResultsProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [scores, setScores] = useState<SkinScores | null>(null);
  const { toast } = useToast();

  // Analizza la pelle con Gemini AI
  useEffect(() => {
    const analyzeSkin = async () => {
      try {
        if (!photoPreview) {
          throw new Error('Nessuna foto disponibile');
        }

        // Estrai solo i dati base64 dall'URL
        const base64Data = photoPreview.split(',')[1];

        console.log('Invio foto a Gemini per analisi...');
        
        const { data, error } = await supabase.functions.invoke('analyze-skin', {
          body: { imageBase64: base64Data }
        });

        if (error) throw error;

        console.log('Analisi completata:', data);
        setScores(data);
        setIsAnalyzing(false);
      } catch (error) {
        console.error('Errore analisi pelle:', error);
        toast({
          title: "Errore nell'analisi",
          description: "Sto usando valori predefiniti per continuare.",
          variant: "destructive",
        });
        
        // Fallback a valori simulati
        setScores({
          idratazione: 7,
          elasticita: 6,
          pigmentazione: 8,
          acne: 5,
          rughe: 7,
          pori: 6,
          rossore: 8,
        });
        setIsAnalyzing(false);
      }
    };

    analyzeSkin();
  }, [photoPreview, toast]);

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-600";
    if (score >= 4) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 7) return "Ottimo";
    if (score >= 4) return "Buono";
    return "Da Migliorare";
  };

  if (isAnalyzing) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
          <div>
            <p className="font-semibold text-lg">Analisi in corso...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sto analizzando la tua pelle con Gemini AI ✨
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!scores) {
    return null;
  }

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
              idratazione: "💧 Idratazione",
              elasticita: "🎈 Elasticità",
              pigmentazione: "🎨 Pigmentazione",
              acne: "🔴 Acne/Imperfezioni",
              rughe: "📏 Rughe",
              pori: "⚫ Pori",
              rossore: "🌡️ Rossore",
            };

            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{labels[key]}</span>
                  <span className={cn("font-bold", getScoreColor(value))}>
                    {value}/10 - {getScoreLabel(value)}
                  </span>
                </div>
                <Progress value={value * 10} className="h-2" />
              </div>
            );
          })}
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-sm">🎯 Aree Prioritarie:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {Object.entries(scores)
              .filter(([_, score]) => score < 5)
              .map(([key, score]) => {
                const labels: Record<string, string> = {
                  idratazione: "Idratazione",
                  elasticita: "Elasticità",
                  pigmentazione: "Uniformità del tono",
                  acne: "Imperfezioni",
                  rughe: "Linee sottili",
                  pori: "Texture della pelle",
                  rossore: "Sensibilità",
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
