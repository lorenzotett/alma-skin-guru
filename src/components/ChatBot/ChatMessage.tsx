import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  sender: "bot" | "user";
  children: ReactNode;
  avatar?: string;
}

// Funzione per rendere i link cliccabili nel testo
const renderTextWithLinks = (text: string) => {
  // Regex per trovare link in formato markdown [testo](url) o URL semplici
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const urlRegex = /(https?:\/\/[^\s<>\[\]]+)/g;
  
  // Prima gestiamo i link markdown
  let processedText = text;
  const markdownLinks: { text: string; url: string; placeholder: string }[] = [];
  let markdownMatch;
  let markdownIndex = 0;
  
  while ((markdownMatch = markdownLinkRegex.exec(text)) !== null) {
    const placeholder = `___MARKDOWN_LINK_${markdownIndex}___`;
    markdownLinks.push({
      text: markdownMatch[1],
      url: markdownMatch[2],
      placeholder
    });
    processedText = processedText.replace(markdownMatch[0], placeholder);
    markdownIndex++;
  }
  
  // Poi splittiamo per URL semplici
  const parts = processedText.split(urlRegex);
  
  return parts.map((part, index) => {
    // Controlla se è un placeholder per link markdown
    const markdownLink = markdownLinks.find(ml => ml.placeholder === part);
    if (markdownLink) {
      return (
        <a
          key={index}
          href={markdownLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-2 underline-offset-4 hover:text-primary/80 hover:decoration-primary/80 transition-all duration-200 font-semibold"
        >
          {markdownLink.text}
        </a>
      );
    }
    
    // Controlla se è un URL semplice
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-2 underline-offset-4 hover:text-primary/80 hover:decoration-primary/80 transition-all duration-200 font-semibold break-all"
        >
          {part}
        </a>
      );
    }
    
    return part;
  });
};

// Funzione per processare il contenuto e renderizzare markdown formattato
const processContent = (content: ReactNode): ReactNode => {
  if (typeof content === 'string') {
    return (
      <ReactMarkdown
        components={{
          // Stili personalizzati per gli elementi markdown
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-2 underline-offset-4 hover:text-primary/80 hover:decoration-primary/80 transition-all duration-200 font-semibold"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }
  return content;
};

export const ChatMessage = ({ sender, children, avatar }: ChatMessageProps) => {
  const isBot = sender === "bot";
  
  return (
    <div className={cn(
      "flex gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700", 
      !isBot && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg",
        isBot 
          ? "bg-gradient-to-br from-primary to-accent" 
          : "bg-gradient-to-br from-accent to-primary"
      )}>
        <span className="text-lg sm:text-xl md:text-2xl">{isBot ? "🌸" : "👤"}</span>
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "max-w-[90%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 shadow-lg transition-all hover:shadow-xl",
        isBot 
          ? "bg-card border border-border rounded-tl-none animate-in slide-in-from-left-2" 
          : "bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-tr-none animate-in slide-in-from-right-2"
      )}>
        <div className="text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-wrap text-foreground">
          {processContent(children)}
        </div>
      </div>
    </div>
  );
};
