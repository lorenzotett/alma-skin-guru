import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatContainerProps {
  children: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

export const ChatContainer = ({ children, onBack, showBack = true }: ChatContainerProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary to-accent/10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
          {showBack && onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">🌸</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-foreground text-sm sm:text-base truncate">Alma Beauty Assistant</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Il tuo consulente di bellezza personale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
};
