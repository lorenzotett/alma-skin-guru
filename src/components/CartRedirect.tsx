import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CartRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentProduct, setCurrentProduct] = useState(0);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const productIds = searchParams.get('products')?.split(',').map(Number) || [];
  const storeUrl = searchParams.get('store') || 'https://almanaturalbeauty.it';

  useEffect(() => {
    if (productIds.length === 0) {
      setStatus('error');
      setErrorMessage('Nessun prodotto da aggiungere');
      return;
    }

    addProductsToCart();
  }, []);

  const addProductsToCart = async () => {
    const totalProducts = productIds.length;
    let addedCount = 0;
    let failedProducts: number[] = [];

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      setCurrentProduct(i + 1);

      try {
        // Use a hidden iframe to add the product via WooCommerce's native add-to-cart URL
        // This maintains the user's session cookies
        const addUrl = `${storeUrl}/?add-to-cart=${productId}`;
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = addUrl;
        document.body.appendChild(iframe);

        // Wait for the iframe to load
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            document.body.removeChild(iframe);
            reject(new Error('Timeout'));
          }, 5000);

          iframe.onload = () => {
            clearTimeout(timeout);
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve();
            }, 500);
          };

          iframe.onerror = () => {
            clearTimeout(timeout);
            document.body.removeChild(iframe);
            reject(new Error('Failed to load'));
          };
        });

        addedCount++;
        setProgress(Math.round((addedCount / totalProducts) * 100));
      } catch (error) {
        console.error(`Failed to add product ${productId}:`, error);
        failedProducts.push(productId);
      }
    }

    if (addedCount === totalProducts) {
      setStatus('success');
      // Wait a moment then redirect to cart
      setTimeout(() => {
        window.location.href = `${storeUrl}/carrello/`;
      }, 1500);
    } else if (addedCount > 0) {
      setStatus('success');
      setErrorMessage(`${addedCount} di ${totalProducts} prodotti aggiunti. Reindirizzamento al carrello...`);
      setTimeout(() => {
        window.location.href = `${storeUrl}/carrello/`;
      }, 2000);
    } else {
      setStatus('error');
      setErrorMessage('Impossibile aggiungere i prodotti al carrello');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#faf8f5] to-[#f1e8dc]">
      <Card className="max-w-md w-full p-8 space-y-6 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold text-primary">
              Aggiunta prodotti al carrello
            </h2>
            <p className="text-muted-foreground">
              Prodotto {currentProduct} di {productIds.length}
            </p>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Attendere prego, non chiudere questa pagina...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
            <h2 className="text-2xl font-bold text-primary">
              Prodotti aggiunti!
            </h2>
            {errorMessage && (
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            )}
            <p className="text-muted-foreground">
              Reindirizzamento al carrello...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold text-destructive">
              Errore
            </h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.location.href = `${storeUrl}/carrello/`}
                className="w-full"
              >
                Vai al carrello
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Torna alla home
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
