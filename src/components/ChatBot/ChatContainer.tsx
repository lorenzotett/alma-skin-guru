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
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {showBack && onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🌸</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground">Alma Beauty Assistant</h1>
              <p className="text-xs text-muted-foreground">Il tuo consulente di bellezza personale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
};
