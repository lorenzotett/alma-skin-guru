import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  sender: "bot" | "user";
  children: ReactNode;
  avatar?: string;
}

// Funzione per rendere i link cliccabili nel testo
const renderTextWithLinks = (text: string) => {
  // Regex per trovare URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 transition-colors font-medium"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Funzione per processare il contenuto e renderizzare con link cliccabili
const processContent = (content: ReactNode): ReactNode => {
  if (typeof content === 'string') {
    // Split per righe per mantenere la formattazione
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => (
      <span key={lineIndex}>
        {renderTextWithLinks(line)}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    ));
  }
  return content;
};

export const ChatMessage = ({ sender, children, avatar }: ChatMessageProps) => {
  const isBot = sender === "bot";
  
  return (
    <div className={cn(
      "flex gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700", 
      !isBot && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md",
        isBot 
          ? "bg-gradient-to-br from-primary to-accent" 
          : "bg-gradient-to-br from-accent to-primary"
      )}>
        <span className="text-base sm:text-lg md:text-xl">{isBot ? "🌸" : "👤"}</span>
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-soft transition-all hover:shadow-md",
        isBot 
          ? "bg-card border border-border rounded-tl-none animate-in slide-in-from-left-2" 
          : "bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-tr-none animate-in slide-in-from-right-2"
      )}>
        <div className="text-sm sm:text-base whitespace-pre-wrap">
          {processContent(children)}
        </div>
      </div>
    </div>
  );
};
