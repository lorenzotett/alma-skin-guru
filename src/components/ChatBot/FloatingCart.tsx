import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export const FloatingCart = () => {
  const { cartItems, cartCount, removeFromCart, getTotalPrice, clearCart, shouldOpenCart, setShouldOpenCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Auto-open cart when products are added
  useEffect(() => {
    if (shouldOpenCart && cartCount > 0) {
      setIsOpen(true);
      setShouldOpenCart(false);
    }
  }, [shouldOpenCart, cartCount, setShouldOpenCart]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Il carrello è vuoto');
      return;
    }

    const productsWithWooId = cartItems.filter(item => item.woocommerce_id);
    
    if (productsWithWooId.length === 0) {
      toast.error('Nessun prodotto disponibile per il checkout');
      return;
    }

    setIsCheckingOut(true);
    
    try {
      const productIds = productsWithWooId.map(item => item.woocommerce_id!);
      
      const { data, error } = await supabase.functions.invoke('add-to-woo-cart', {
        body: { productIds }
      });

      if (error) throw error;

      if (data.success && data.cartUrl) {
        toast.success('Reindirizzamento al carrello WooCommerce...', {
          duration: 2000,
        });
        
        // Redirect to WooCommerce cart with all products
        setTimeout(() => {
          window.open(data.cartUrl, '_blank');
        }, 500);
      } else {
        throw new Error('Errore nella risposta del server');
      }
    } catch (error) {
      console.error('Errore checkout:', error);
      toast.error('Errore durante il checkout. Riprova.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cartCount === 0) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg hover:scale-110 transition-all duration-300 animate-fade-in z-50"
          aria-label="Apri carrello"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 rounded-full animate-pulse"
            >
              {cartCount}
            </Badge>
          </div>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">Il Tuo Carrello</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {cartItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Il carrello è vuoto
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                      {item.brand && (
                        <p className="text-xs text-muted-foreground">{item.brand}</p>
                      )}
                      <p className="font-semibold text-primary mt-1">
                        €{item.price.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Totale:</span>
                  <span className="text-2xl font-bold text-primary">
                    €{getTotalPrice().toFixed(2)}
                  </span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? 'Preparazione...' : 'Acquista Ora'}
                </Button>

                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full mt-2"
                  disabled={isCheckingOut}
                >
                  Svuota Carrello
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
