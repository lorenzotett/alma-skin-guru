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
    <div className="min-h-screen flex flex-col bg-[#f5ebe0]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f9f5f0]/95 backdrop-blur-lg border-b border-primary/20 shadow-soft">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          {showBack && onBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack} 
              className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:bg-primary/10 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </Button>
          )}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-xl sm:text-2xl md:text-3xl">🌸</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-foreground text-base sm:text-lg md:text-xl lg:text-2xl truncate">
                Alma Beauty Assistant
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground truncate flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0"></span>
                Online - Qui per aiutarti ✨
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12">
          {children}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="sticky bottom-0 bg-gradient-to-t from-[#f5ebe0]/90 to-transparent backdrop-blur-sm py-3 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs sm:text-sm md:text-base text-foreground/80 font-semibold">
            Tutte le tue informazioni sono sicure e verranno utilizzate solo per consigliarti i prodotti migliori 🔒
          </p>
        </div>
      </div>

    </div>
  );
};
