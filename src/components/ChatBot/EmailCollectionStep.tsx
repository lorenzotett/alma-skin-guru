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
    
    // Validate full name
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast({
        title: "Nome richiesto",
        description: "Inserisci il tuo nome completo",
        variant: "destructive",
      });
      return;
    }

    if (trimmedName.length > 100) {
      toast({
        title: "Nome troppo lungo",
        description: "Il nome deve essere al massimo 100 caratteri",
        variant: "destructive",
      });
      return;
    }

    // Normalize and validate email
    const normalizedEmail = email.trim().toLowerCase();
    
    if (normalizedEmail.length > 255) {
      toast({
        title: "Email troppo lunga",
        description: "L'email deve essere al massimo 255 caratteri",
        variant: "destructive",
      });
      return;
    }

    // RFC 5322 simplified email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast({
        title: "Email non valida",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }

    // Validate phone if provided
    if (phone && phone.trim()) {
      const trimmedPhone = phone.trim();
      if (trimmedPhone.length > 20) {
        toast({
          title: "Telefono troppo lungo",
          description: "Il numero di telefono deve essere al massimo 20 caratteri",
          variant: "destructive",
        });
        return;
      }

      // Basic phone format validation
      const phoneRegex = /^[+\d\s()-]*$/;
      if (!phoneRegex.test(trimmedPhone)) {
        toast({
          title: "Telefono non valido",
          description: "Il numero di telefono contiene caratteri non validi",
          variant: "destructive",
        });
        return;
      }
    }

    if (!privacyConsent) {
      toast({
        title: "Consenso richiesto",
        description: "Devi accettare l'informativa sulla privacy per continuare",
        variant: "destructive",
      });
      return;
    }

    onNext({
      fullName: trimmedName,
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
    });
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Perfetto! 🎉 Lasciami i tuoi dati per inviarti:
        </p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✓ La tua analisi completa</li>
          <li>✓ Codice sconto <strong className="text-primary">15%</strong></li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs">Nome completo *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Nome e cognome"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="tua.email@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs">Telefono (opzionale)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+39 333 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
            />
            <Label htmlFor="marketing" className="text-xs leading-tight cursor-pointer">
              Ricevi offerte esclusive Alma
            </Label>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="privacy"
              checked={privacyConsent}
              onCheckedChange={(checked) => setPrivacyConsent(checked as boolean)}
              required
            />
            <Label htmlFor="privacy" className="text-xs leading-tight cursor-pointer">
              Accetto la{" "}
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
          className="w-full"
          disabled={!fullName || !email || !privacyConsent}
        >
          RICEVI ANALISI 🎁
        </Button>
      </form>
    </Card>
  );
};