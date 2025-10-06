import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, ShoppingCart, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendedProducts, getPersonalizedMessage, type Product } from "@/lib/productRecommendations";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError, logError } from "@/lib/errorHandler";

interface ResultsPageProps {
  userData: {
    name: string;
    skinType: string;
    age: number;
    concerns: string[];
    productType?: string;
    additionalInfo?: string;
    email: string;
    fullName: string;
    phone?: string;
    photo?: File;
  };
  onRestart: () => void;
}

export const ResultsPage = ({ userData, onRestart }: ResultsPageProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const discountCode = `ALMA15${userData.name.toUpperCase()}`;

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      // Fetch all active products
      const { data: allProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      if (allProducts) {
        const recommended = getRecommendedProducts(
          {
            skinType: userData.skinType,
            age: userData.age,
            concerns: userData.concerns,
            productType: userData.productType
          },
          allProducts
        );
        
        setProducts(recommended);
        
        // Save to database
        await saveAnalysis(recommended);
      }
    } catch (error) {
      logError(error, 'loadRecommendations');
      toast({
        title: "Errore",
        description: "Impossibile caricare i prodotti raccomandati",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async (recommendedProducts: Product[]) => {
    try {
      // Create contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          name: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          skin_type: userData.skinType,
          age: userData.age,
          concerns: userData.concerns,
          product_type: userData.productType,
          additional_info: userData.additionalInfo,
          discount_code: discountCode
        })
        .select()
        .single();

      if (contactError) {
        logError(contactError, 'saveAnalysis-contact');
        throw contactError;
      }

      // Link products to contact
      if (contact && recommendedProducts.length > 0) {
        const contactProducts = recommendedProducts.map(p => ({
          contact_id: contact.id,
          product_id: p.id
        }));

        const { error: productsError } = await supabase
          .from('contact_products')
          .insert(contactProducts);

        if (productsError) {
          logError(productsError, 'saveAnalysis-products');
          throw productsError;
        }
      }

      toast({
        title: "Analisi salvata! ✓",
        description: "Riceverai presto un'email con i dettagli"
      });
    } catch (error: any) {
      logError(error, 'saveAnalysis');
      toast({
        title: "Errore",
        description: getUserFriendlyError(error),
        variant: "destructive"
      });
    }
  };

  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  const discountedValue = totalValue * 0.85;
  const savings = totalValue - discountedValue;

  const personalizedMessage = getPersonalizedMessage({
    skinType: userData.skinType,
    age: userData.age,
    concerns: userData.concerns,
    productType: userData.productType
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-accent/10">
        <Card className="p-8">
          <p className="text-lg text-primary">Sto preparando la tua routine personalizzata... ✨</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary to-accent/10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card className="p-8 text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            ✨ Ecco la tua Routine Alma personalizzata, {userData.name}! ✨
          </h1>
          
          <Card className="p-6 bg-secondary/50">
            <h3 className="font-bold text-lg mb-3">📋 IL TUO PROFILO PELLE</h3>
            <div className="grid md:grid-cols-2 gap-3 text-left text-sm">
              <p>• <strong>Tipo di pelle:</strong> {userData.skinType}</p>
              <p>• <strong>Età:</strong> {userData.age} anni</p>
              <p className="md:col-span-2">• <strong>Preoccupazioni:</strong> {userData.concerns.join(', ')}</p>
            </div>
          </Card>

          <p className="text-foreground">{personalizedMessage}</p>
        </Card>

        {/* Products */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">
            🌸 I TUOI PRODOTTI ALMA PERSONALIZZATI
          </h2>
          
          <div className="grid gap-6">
            {products.map((product, index) => (
              <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {product.image_url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full md:w-48 h-48 object-cover rounded-lg bg-secondary/30"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          ⭐ PERFETTO PER TE
                        </Badge>
                        <p className="text-xs text-muted-foreground">{product.step}</p>
                        <h3 className="text-xl font-bold text-foreground mt-1">{product.name}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">€{product.price.toFixed(2)}</p>
                      </div>
                    </div>

                    {product.description_short && (
                      <p className="text-sm text-muted-foreground">{product.description_short}</p>
                    )}

                    {product.key_ingredients && product.key_ingredients.length > 0 && (
                      <div>
                        <p className="font-semibold text-sm mb-1">🧪 INGREDIENTI CHIAVE:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {product.key_ingredients.slice(0, 3).map((ing, i) => (
                            <li key={i}>• {ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button asChild className="flex-1">
                        <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          ACQUISTA ORA
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          MAGGIORI INFO
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Discount & CTA */}
        <Card className="p-8 text-center space-y-4 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="space-y-2">
            <p className="text-lg">💰 <strong>VALORE TOTALE ROUTINE:</strong> €{totalValue.toFixed(2)}</p>
            <p className="text-2xl font-bold text-primary">
              🎁 CON IL TUO CODICE SCONTO 15%: €{discountedValue.toFixed(2)}
            </p>
            <p className="text-green-600 font-semibold">RISPARMI: €{savings.toFixed(2)}</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-xl font-bold">💌 RICEVI LA TUA ROUTINE VIA EMAIL</h3>
            <p className="text-sm">La tua analisi completa ti è stata inviata a: <strong>{userData.email}</strong></p>
            
            <div className="bg-background/50 p-4 rounded-lg text-sm text-left space-y-1">
              <p>✓ Riepilogo completo della tua analisi</p>
              <p>✓ Lista prodotti raccomandati con link diretti</p>
              <p>✓ Codice sconto 15%: <strong className="text-primary">{discountCode}</strong></p>
              <p>✓ Guida step-by-step alla routine</p>
              <p>✓ Consigli personalizzati</p>
            </div>

            <Button size="lg" asChild className="w-full">
              <a href="https://almanaturalbeauty.it" target="_blank" rel="noopener noreferrer">
                VAI ALLO SHOP ALMA 🛍️
              </a>
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            🔄 Ricomincia Analisi
          </Button>
        </div>

        {/* Footer */}
        <Card className="p-6 text-center text-sm text-muted-foreground">
          <p>Hai altre domande o dubbi sui prodotti? Scrivimi pure!</p>
          <p className="mt-2">
            Per assistenza diretta: <a href="mailto:info@almanaturalbeauty.it" className="text-primary underline">info@almanaturalbeauty.it</a>
          </p>
          <p className="mt-4 text-primary">Grazie per aver scelto Alma Natural Beauty! 🌸</p>
        </Card>
      </div>
    </div>
  );
};