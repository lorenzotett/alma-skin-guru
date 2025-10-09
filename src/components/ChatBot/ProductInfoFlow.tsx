import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatContainer } from "./ChatContainer";
import { ChatMessage } from "./ChatMessage";
import { Send, Sparkles, Loader2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProductInfoFlowProps {
  userName: string;
  onBack: () => void;
}

export const ProductInfoFlow = ({ userName, onBack }: ProductInfoFlowProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Ciao ${userName}! 💚✨\n\nSono la tua consulente beauty personale Alma e sono qui per aiutarti a trovare i prodotti perfetti per te!\n\nRaccontami:\n• Che tipo di problemi ha la tua pelle?\n• Cosa vorresti migliorare?\n• Hai già provato qualche prodotto specifico?\n• Cerchi qualcosa per una problematica specifica?\n\nNon preoccuparti, ti guiderò passo dopo passo! 🌸`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('product-advisor', {
        body: {
          message: userMessage,
          conversationHistory: messages,
          userName
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (error) {
      console.error('Errore chat prodotti:', error);
      toast({
        title: "Errore",
        description: "Non riesco a rispondere al momento. Riprova!",
        variant: "destructive",
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Mi dispiace, ho avuto un problema tecnico. Puoi riprovare? 🙏' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "Ho la pelle grassa, cosa mi consigli?",
    "Cerco un prodotto anti-età efficace",
    "Quali prodotti hai per le macchie scure?",
    "Vorrei una routine completa per pelle secca",
    "Dove posso comprare i prodotti Alma?",
    "Quali ingredienti naturali usate?"
  ];

  return (
    <ChatContainer onBack={onBack} showBack={true}>
      {/* Header Info */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 backdrop-blur shadow-lg">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md flex-shrink-0">
            <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">Consulenza Prodotti AI</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Chiedimi qualsiasi cosa sui nostri prodotti! Ti aiuterò a trovare quello perfetto per te e ti dirò dove acquistarlo. 💚
            </p>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <div className="space-y-3 sm:space-y-4">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} sender={msg.role === 'user' ? 'user' : 'bot'}>
            <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{msg.content}</p>
          </ChatMessage>
        ))}
        
        {isLoading && (
          <ChatMessage sender="bot">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-xs sm:text-sm">Sto pensando...</p>
            </div>
          </ChatMessage>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <Card className="p-4 sm:p-5 bg-primary/5 backdrop-blur border-primary/20 shadow-lg">
          <p className="text-xs sm:text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Domande rapide che potresti fare:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {quickQuestions.map((q, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(q);
                  setTimeout(() => sendMessage(), 100);
                }}
                className="text-[10px] sm:text-xs h-auto py-2 sm:py-3 text-left justify-start border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                disabled={isLoading}
              >
                <span className="mr-2">→</span>
                <span className="break-words">{q}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-accent/10 to-primary/10 border-primary/30 text-center backdrop-blur shadow-lg">
        <p className="text-xs sm:text-sm font-semibold text-primary mb-2">🌸 Scopri la tua routine ideale</p>
        <p className="text-xs text-muted-foreground">Ti aiuterò a trovare i prodotti perfetti per la tua pelle su almanaturalbeauty.it</p>
      </Card>

      {/* Input Area - Fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#f5ebe0] pt-4 pb-2 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 border-t border-primary/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 p-2 sm:p-3 bg-white/60 backdrop-blur rounded-lg border border-primary/20 shadow-md">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="💬 Scrivi qui la tua domanda..."
              disabled={isLoading}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs sm:text-sm"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="hover-scale bg-primary hover:bg-primary/90 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-2">
            Premi Invio per inviare • Powered by Gemini AI
          </p>
        </div>
      </div>
    </ChatContainer>
  );
};
