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
      content: `Ciao ${userData.name}! 💚 Sono il tuo consulente beauty personale di Alma. Ti ho preparato una routine su misura basata sulla tua analisi della pelle. Hai domande? Vuoi sapere come usare i prodotti o perché sono perfetti per te?`
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
    "Come uso questi prodotti?",
    "Perché hai scelto questi prodotti per me?",
    "Posso usarli tutti insieme?",
    "Quanto tempo ci vuole per vedere i risultati?",
  ];

  return (
    <Card className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        <div>
          <h3 className="font-bold text-lg">💬 Consulente Beauty AI</h3>
          <p className="text-sm text-muted-foreground">
            Chiedimi tutto sui tuoi prodotti e la tua routine!
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scroll-smooth">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
        <div className="space-y-2 animate-fade-in">
          <p className="text-xs text-muted-foreground">Domande frequenti:</p>
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
                className="text-xs h-auto py-2 hover-scale text-left justify-start"
                disabled={isLoading}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Fai una domanda sulla tua routine..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="hover-scale"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
