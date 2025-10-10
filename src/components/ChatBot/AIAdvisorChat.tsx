import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAdvisorChatProps {
  userData: any;
  recommendedProducts: any[];
}

export const AIAdvisorChat = ({ userData, recommendedProducts }: AIAdvisorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Ciao ${userData.name}! 💚✨\n\nSono qui per te come la tua consulente beauty personale Alma! Ho creato questa routine su misura analizzando in dettaglio la tua pelle.\n\nPuoi chiedermi qualsiasi cosa:\n• Come e quando usare ogni prodotto\n• Perché ho scelto proprio questi per te\n• Quando vedrai i primi risultati\n• Come personalizzare la tua routine\n• Consigli specifici per le tue problematiche\n\nNon esitare a farmi tutte le domande che vuoi! Sono qui per aiutarti a ottenere i migliori risultati possibili 🌸`
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
      const { data, error } = await supabase.functions.invoke('chat-advisor', {
        body: {
          message: userMessage,
          userData,
          recommendedProducts
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (error) {
      console.error('Errore chat:', error);
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
    "Come uso questi prodotti nella routine?",
    "Perché hai scelto proprio questi prodotti per me?",
    "Posso usarli tutti insieme o ci sono combinazioni da evitare?",
    "In quanto tempo vedrò i primi risultati?",
    "Che differenza c'è tra i prodotti giorno e notte?",
    "Come posso personalizzare la mia routine?"
  ];

  return (
    <Card className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 animate-fade-in border-2 border-primary/30 shadow-xl bg-[#f9f5f0]/95 backdrop-blur">
      <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
        <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary animate-pulse flex-shrink-0" />
        <div className="min-w-0">
          <h3 className="font-bold text-base sm:text-lg md:text-xl text-primary">💬 Chat con il tuo Consulente AI</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Chiedimi consigli, come usare i prodotti, quando vedere i risultati e molto altro! 🌸
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 scroll-smooth bg-card/40 backdrop-blur p-2 sm:p-3 md:p-4 rounded-lg border border-primary/10">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
                  : 'bg-card text-foreground border-2 border-primary/10'
              }`}
            >
              {msg.role === 'assistant' && <span className="text-base sm:text-lg md:text-xl mr-1 sm:mr-2">💚</span>}
              <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-secondary rounded-2xl px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2">
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-primary" />
              <p className="text-xs sm:text-sm text-muted-foreground">Sto pensando...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="space-y-2 sm:space-y-3 animate-fade-in p-3 sm:p-4 bg-secondary/20 rounded-lg">
          <p className="text-xs sm:text-sm font-semibold text-primary flex items-center gap-1 sm:gap-2">
            <span>💡</span> Domande frequenti che potresti avere:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickQuestions.map((q, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(q);
                  setTimeout(() => sendMessage(), 100);
                }}
                className="text-[10px] sm:text-xs h-auto py-2 sm:py-3 hover-scale text-left justify-start border-primary/20 hover:border-primary/50 hover:bg-primary/5 overflow-hidden"
                disabled={isLoading}
              >
                <span className="mr-1 sm:mr-2 flex-shrink-0">→</span>
                <span className="break-words overflow-hidden">{q}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 p-2 sm:p-3 bg-card/40 backdrop-blur rounded-lg border border-primary/10">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="💬 Scrivi qui la tua domanda..."
          disabled={isLoading}
          className="flex-1 border-primary/20 focus:border-primary text-xs sm:text-sm"
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="hover-scale bg-primary hover:bg-primary/90 h-9 w-9 sm:h-10 sm:w-10"
        >
          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </Card>
  );
};
