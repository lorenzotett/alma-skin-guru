import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EmailCollectionStepProps {
  onNext: (data: { fullName: string; email: string; phone?: string }) => void;
  onBack?: () => void;
}

export const EmailCollectionStep = ({ onNext, onBack }: EmailCollectionStepProps) => {
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

    // RFC 5322 simplified email regex - validazione base migliorata
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast({
        title: "Email non valida",
        description: "Inserisci un indirizzo email valido (es: nome@esempio.com)",
        variant: "destructive",
      });
      return;
    }

    // Extract domain from email
    const emailDomain = normalizedEmail.split('@')[1];
    
    // List of known temporary/fake email domains to block
    const blockedDomains = [
      'tempmail', 'temp-mail', 'throwaway', 'guerrillamail', 'mailinator',
      '10minutemail', 'fakeinbox', 'maildrop', 'yopmail', 'getnada',
      'trashmail', 'sharklasers', 'spam4.me', 'mail.tm', 'disposable'
    ];
    
    // Check if it's a blocked temporary email domain
    const isBlockedDomain = blockedDomains.some(blocked => emailDomain.includes(blocked));
    if (isBlockedDomain) {
      toast({
        title: "Email non valida",
        description: "Non sono accettate email temporanee. Usa un'email reale.",
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
    <Card className="p-4 sm:p-6 space-y-4 bg-[#f9f5f0]/95 backdrop-blur border-primary/20 shadow-lg">
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold text-primary">Perfetto! 🎉</h3>
        <p className="text-sm sm:text-base font-medium">
          Lasciami i tuoi dati per visualizzare:
        </p>
        <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
          <li>✓ La tua analisi completa personalizzata</li>
          <li>✓ Routine skincare su misura per te</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs sm:text-sm">Nome completo *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Nome e cognome"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="text-sm sm:text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="tua.email@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-sm sm:text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs sm:text-sm">Telefono (opzionale)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+39 333 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="marketing" className="text-xs sm:text-sm leading-tight cursor-pointer">
              Ricevi offerte esclusive Alma
            </Label>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="privacy"
              checked={privacyConsent}
              onCheckedChange={(checked) => setPrivacyConsent(checked as boolean)}
              required
              className="mt-0.5"
            />
            <Label htmlFor="privacy" className="text-xs sm:text-sm leading-tight cursor-pointer">
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

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {onBack && (
            <Button 
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              ← Indietro
            </Button>
          )}
          <Button 
            type="submit" 
            className="flex-1 bg-primary hover:bg-primary/90 text-sm sm:text-base font-bold order-1 sm:order-2"
            disabled={!fullName || !email || !privacyConsent}
          >
            VISUALIZZA RISULTATI 🎁
          </Button>
        </div>
      </form>
    </Card>
  );
};