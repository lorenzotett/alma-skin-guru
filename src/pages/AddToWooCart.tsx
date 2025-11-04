import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

const AddToWooCart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentProduct, setCurrentProduct] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const productIds = searchParams.get('products')?.split(',').filter(Boolean) || [];
    const storeUrl = searchParams.get('store');

    if (!productIds.length || !storeUrl) {
      setError('Parametri mancanti');
      return;
    }

    const addProductsSequentially = async () => {
      const baseUrl = storeUrl.endsWith('/') ? storeUrl.slice(0, -1) : storeUrl;
      
      for (let i = 0; i < productIds.length; i++) {
        setCurrentProduct(i + 1);
        setProgress(((i + 1) / productIds.length) * 100);

        try {
          // Create a hidden iframe to add product to cart
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = `${baseUrl}/?add-to-cart=${productIds[i]}&quantity=1`;
          document.body.appendChild(iframe);

          // Wait for iframe to load
          await new Promise((resolve) => {
            iframe.onload = resolve;
            setTimeout(resolve, 1500); // Fallback timeout
          });

          document.body.removeChild(iframe);
        } catch (err) {
          console.error('Error adding product:', productIds[i], err);
        }
      }

      // All products added, redirect to cart
      setTimeout(() => {
        window.location.href = `${baseUrl}/carrello/`;
      }, 500);
    };

    addProductsSequentially();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-destructive">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 text-primary hover:underline"
          >
            Torna alla home
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <Card className="p-8 max-w-md w-full">
        <div className="flex flex-col items-center space-y-6">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Aggiunta prodotti al carrello</h2>
            <p className="text-muted-foreground">
              Prodotto {currentProduct} in corso...
            </p>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </Card>
    </div>
  );
};

export default AddToWooCart;
