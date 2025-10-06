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
    <Card className="p-6 space-y-4 animate-fade-in border-2 border-primary/20 shadow-lg">
      <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        <div>
          <h3 className="font-bold text-xl text-primary">💬 Chat con il tuo Consulente AI</h3>
          <p className="text-sm text-muted-foreground">
            Chiedimi consigli, come usare i prodotti, quando vedere i risultati e molto altro! 🌸
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scroll-smooth bg-gradient-to-b from-secondary/20 to-transparent p-4 rounded-lg">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
                  : 'bg-card text-foreground border-2 border-primary/10'
              }`}
            >
              {msg.role === 'assistant' && <span className="text-xl mr-2">💚</span>}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Sto pensando...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="space-y-3 animate-fade-in p-4 bg-secondary/20 rounded-lg">
          <p className="text-sm font-semibold text-primary flex items-center gap-2">
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
                className="text-xs h-auto py-3 hover-scale text-left justify-start border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                disabled={isLoading}
              >
                <span className="mr-2">→</span>
                {q}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 p-3 bg-secondary/30 rounded-lg">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="💬 Scrivi qui la tua domanda..."
          disabled={isLoading}
          className="flex-1 border-primary/20 focus:border-primary"
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="hover-scale bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
