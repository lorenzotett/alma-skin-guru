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
    console.log('🛒 CHECKOUT STARTED');
    console.log('Cart items:', cartItems);
    
    if (cartItems.length === 0) {
      toast.error('Il carrello è vuoto');
      return;
    }

    const productsWithWooId = cartItems.filter(item => item.woocommerce_id);
    console.log('Products with WooCommerce ID:', productsWithWooId);
    
    if (productsWithWooId.length === 0) {
      toast.error('Nessun prodotto disponibile per il checkout');
      return;
    }

    setIsCheckingOut(true);
    
    try {
      const productIds = productsWithWooId.map(item => item.woocommerce_id!);
      console.log('🚀 Calling edge function with product IDs:', productIds);
      
      const { data, error } = await supabase.functions.invoke('add-to-woo-cart', {
        body: { productIds }
      });

      console.log('📦 Edge function response - data:', data);
      console.log('📦 Edge function response - error:', error);

      if (error) {
        console.error('Edge function error:', error);
        toast.error(error.message || 'Errore durante la preparazione del carrello');
        return;
      }

      if (!data?.success) {
        console.error('Operation failed:', data);
        toast.error(data?.message || 'Errore durante la preparazione del carrello');
        return;
      }

      if (data?.success && data?.cartUrl) {
        console.log('✅ SUCCESS! Cart URL received:', data.cartUrl);
        console.log('🔍 Debug info:', data.debug);
        
        // Validate that URL is absolute
        if (!data.cartUrl.startsWith('http://') && !data.cartUrl.startsWith('https://')) {
          console.error('❌ Invalid cart URL - not absolute:', data.cartUrl);
          toast.error('Errore: URL del carrello non valido');
          return;
        }
        
        toast.success('Reindirizzamento al carrello WooCommerce...', {
          duration: 2000,
        });
        
        // Open WooCommerce cart in new tab
        console.log('🌐 Opening URL in new window:', data.cartUrl);
        const newWindow = window.open(data.cartUrl, '_blank', 'noopener,noreferrer');
        
        console.log('🪟 Window opened:', !!newWindow);
        
        if (!newWindow) {
          console.error('❌ Failed to open window - popup may be blocked');
          toast.error('Impossibile aprire il carrello. Verifica che i popup non siano bloccati.');
          return;
        }
        
        // Clear cart after successful checkout
        setTimeout(() => {
          clearCart();
          setIsOpen(false);
        }, 2000);
      } else {
        console.error('❌ Invalid response - no success or cartUrl:', data);
        toast.error(data?.message || 'Errore: risposta non valida dal server');
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
