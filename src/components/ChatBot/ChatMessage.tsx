import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  sender: "bot" | "user";
  children: ReactNode;
  avatar?: string;
}

export const ChatMessage = ({ sender, children, avatar }: ChatMessageProps) => {
  const isBot = sender === "bot";
  
  return (
    <div className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500", !isBot && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isBot ? "bg-primary/20" : "bg-accent/20"
      )}>
        <span className="text-lg">{isBot ? "🌸" : "👤"}</span>
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
        isBot 
          ? "bg-card border border-border rounded-tl-none" 
          : "bg-primary/10 border border-primary/20 rounded-tr-none"
      )}>
        {children}
      </div>
    </div>
  );
};
