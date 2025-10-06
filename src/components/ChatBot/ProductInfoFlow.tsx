import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, ShoppingCart, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductInfoFlowProps {
  userName: string;
  onBack: () => void;
}

export const ProductInfoFlow = ({ userName, onBack }: ProductInfoFlowProps) => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,description_short.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      setProducts(data || []);
      setSearched(true);

      if (!data || data.length === 0) {
        toast({
          title: "Nessun prodotto trovato",
          description: "Prova con una ricerca diversa o fai l'analisi completa della pelle"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Errore di ricerca",
        description: "Riprova tra poco",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-accent/10">
      <Card className="max-w-3xl w-full p-8 space-y-6 shadow-lg">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna indietro
        </Button>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            Perfetto, {userName}!
          </h2>
          <p className="text-foreground">
            Quale prodotto ti interessa nello specifico? Quali informazioni vorresti avere sul prodotto?
          </p>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="Es: acido ialuronico, crema viso, detergente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-lg"
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? "Cerco..." : "Cerca"}
          </Button>
        </div>

        {searched && products.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="font-bold text-lg">Prodotti trovati:</h3>
            {products.map((product) => (
              <Card key={product.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full md:w-32 h-32 object-cover rounded-lg bg-secondary/30"
                    />
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-lg text-foreground">{product.name}</h4>
                    <p className="text-2xl font-bold text-primary">€{product.price}</p>
                    {product.description_short && (
                      <p className="text-sm text-muted-foreground">{product.description_short}</p>
                    )}
                    
                    {product.key_ingredients && product.key_ingredients.length > 0 && (
                      <div>
                        <p className="font-semibold text-sm">🧪 Ingredienti chiave:</p>
                        <p className="text-sm text-muted-foreground">
                          {product.key_ingredients.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    )}

                    {product.concerns_treated && product.concerns_treated.length > 0 && (
                      <div>
                        <p className="font-semibold text-sm">✓ Problematiche che risolve:</p>
                        <p className="text-sm text-muted-foreground">
                          {product.concerns_treated.join(', ')}
                        </p>
                      </div>
                    )}

                    {product.how_to_use && (
                      <div>
                        <p className="font-semibold text-sm">💡 Come usarlo:</p>
                        <p className="text-sm text-muted-foreground">{product.how_to_use}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button asChild>
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
        )}

        {searched && products.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              Mi dispiace, non ho trovato questo prodotto. Vuoi che ti mostri i nostri prodotti per categoria? 
              Oppure preferisci fare l'analisi completa della pelle?
            </p>
            <div className="flex gap-3 mt-4 justify-center">
              <Button onClick={onBack} variant="outline">
                Analisi Pelle
              </Button>
              <Button asChild>
                <a href="https://almanaturalbeauty.it" target="_blank" rel="noopener noreferrer">
                  Vedi tutti i prodotti
                </a>
              </Button>
            </div>
          </Card>
        )}

        {!searched && (
          <p className="text-sm text-muted-foreground text-center">
            Hai altre domande su questo o altri prodotti? Oppure vuoi fare l'analisi completa della pelle?
          </p>
        )}
      </Card>
    </div>
  );
};