import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EmailCollectionStepProps {
  onNext: (data: { fullName: string; email: string; phone?: string }) => void;
}

export const EmailCollectionStep = ({ onNext }: EmailCollectionStepProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !email.trim()) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Inserisci nome completo ed email",
        variant: "destructive"
      });
      return;
    }

    if (!privacyConsent) {
      toast({
        title: "Privacy Policy",
        description: "Devi accettare la Privacy Policy per continuare",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email non valida",
        description: "Inserisci un'email valida",
        variant: "destructive"
      });
      return;
    }

    onNext({ 
      fullName: fullName.trim(), 
      email: email.trim(), 
      phone: phone.trim() || undefined 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-2xl w-full p-8 space-y-6 shadow-lg">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            Perfetto! Sto preparando la tua analisi personalizzata... ✨
          </h2>
          <p className="text-foreground">
            Prima di mostrarti i risultati, lasciami la tua email per inviarti la routine completa 
            e un <strong className="text-primary">codice sconto esclusivo del 15%</strong> sui prodotti Alma! 💌
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Il tuo nome e cognome"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="tua.email@esempio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefono (opzionale)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+39 333 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2">
              <Checkbox
                id="marketing"
                checked={marketingConsent}
                onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
              />
              <Label htmlFor="marketing" className="text-sm leading-tight cursor-pointer">
                Accetto di ricevere consigli personalizzati e offerte esclusive da Alma Natural Beauty
              </Label>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="privacy"
                checked={privacyConsent}
                onCheckedChange={(checked) => setPrivacyConsent(checked as boolean)}
                required
              />
              <Label htmlFor="privacy" className="text-sm leading-tight cursor-pointer">
                Ho letto e accetto la{" "}
                <a 
                  href="https://almanaturalbeauty.it/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Privacy Policy
                </a> *
              </Label>
            </div>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={!fullName || !email || !privacyConsent}
          >
            RICEVI ANALISI E SCONTO 15% 🎁
          </Button>
        </form>
      </Card>
    </div>
  );
};