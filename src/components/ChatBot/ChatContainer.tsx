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
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          {showBack && onBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack} 
              className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </Button>
          )}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-2xl sm:text-3xl">🌸</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-foreground text-base sm:text-lg md:text-xl truncate">
                Alma Beauty Assistant
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Online - Qui per aiutarti ✨
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-4 sm:space-y-5">
          {children}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm py-2 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
            Tutte le tue informazioni sono sicure e verranno utilizzate solo per consigliarti i prodotti migliori 🔒
          </p>
        </div>
      </div>
    </div>
  );
};
