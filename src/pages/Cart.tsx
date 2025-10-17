import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Il carrello è vuoto');
      return;
    }

    setRedirecting(true);
    
    // Show loading toast
    toast.loading('Preparazione checkout...', { duration: 1000 });
    
    // If products have external URLs, redirect to first product's shop
    // In a real scenario, you'd have a unified checkout URL
    setTimeout(() => {
      if (cartItems[0]?.product_url) {
        window.location.href = cartItems[0].product_url;
      } else {
        toast.error('Impossibile procedere al checkout');
        setRedirecting(false);
      }
    }, 1000);
  };

  const totalPrice = getTotalPrice();
  const discountedPrice = totalPrice * 0.85; // 15% discount
  const savings = totalPrice - discountedPrice;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-[#f5ebe0]">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna all'Analisi
          </Button>
          
          <Card className="p-8 md:p-12 text-center space-y-6 bg-gradient-to-br from-white to-primary/5">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-primary">
                Il tuo carrello è vuoto
              </h1>
              <p className="text-muted-foreground">
                Inizia la tua analisi della pelle per scoprire i prodotti perfetti per te
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="gap-2"
            >
              Inizia Analisi
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f5ebe0]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continua Shopping
          </Button>
          
          <Button
            onClick={clearCart}
            variant="outline"
            className="gap-2 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Svuota Carrello
          </Button>
        </div>

        <Card className="p-6 md:p-8 bg-white/95 backdrop-blur">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">
                Il Tuo Carrello
              </h1>
              <p className="text-sm text-muted-foreground">
                {cartItems.length} {cartItems.length === 1 ? 'prodotto' : 'prodotti'} selezionati
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <Card key={item.id} className="p-4 bg-gradient-to-br from-white to-primary/5">
                <div className="flex gap-4">
                  {/* Product Image */}
                  {item.image_url && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-primary mb-1">
                          {item.name}
                        </h3>
                        {item.brand && (
                          <Badge variant="secondary" className="mb-2">
                            {item.brand}
                          </Badge>
                        )}
                        {item.description_short && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description_short}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-primary">
                          €{item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(item.product_url, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visualizza
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                        className="gap-2 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Rimuovi
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Price Summary */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">Subtotale</span>
              <span className="font-semibold">€{totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-lg text-green-600">
              <span className="flex items-center gap-2">
                Sconto Routine Completa (15%)
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  PROMO
                </Badge>
              </span>
              <span className="font-semibold">-€{savings.toFixed(2)}</span>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-2xl font-bold">
              <span className="text-primary">Totale</span>
              <span className="text-primary">€{discountedPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="mt-8 space-y-4">
            <Button
              onClick={handleCheckout}
              disabled={redirecting}
              size="lg"
              className="w-full gap-2 text-lg h-14 bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 shadow-lg hover:shadow-xl"
            >
              {redirecting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Reindirizzamento...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Procedi al Checkout - €{discountedPrice.toFixed(2)}
                </>
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Sarai reindirizzato al nostro shop online per completare l'acquisto in sicurezza
            </p>
          </div>
        </Card>

        {/* Trust Badges */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl">🔒</div>
              <p className="text-xs font-semibold">Pagamento Sicuro</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">🚚</div>
              <p className="text-xs font-semibold">Spedizione Gratuita</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">↩️</div>
              <p className="text-xs font-semibold">Reso Facile</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">💚</div>
              <p className="text-xs font-semibold">100% Naturale</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
