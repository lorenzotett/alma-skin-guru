import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, ShoppingCart, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendedProducts, getPersonalizedMessage, type Product } from "@/lib/productRecommendations";
import { logError } from "@/lib/errorHandler";
import { AIAdvisorChat } from "./AIAdvisorChat";

interface ResultsPageProps {
  userData: {
    name: string;
    skinType: string;
    age: number;
    ageDisplay?: string;
    concerns: string[];
    productTypes?: string[];
    additionalInfo?: string;
    email: string;
    fullName: string;
    phone?: string;
    photo?: File;
    skinScores?: any;
  };
  onRestart: () => void;
}

export const ResultsPage = ({ userData, onRestart }: ResultsPageProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // Expand all categories by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Detergente', 'Tonico', 'Siero', 'Contorno Occhi', 'Crema Viso', 'Protezione Solare', 'Maschera', 'Altri']));

  useEffect(() => {
    // Force immediate scroll to top
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Multiple checks to ensure scroll happens
    const timeouts = [0, 10, 50, 100, 200];
    timeouts.forEach(delay => {
      setTimeout(scrollToTop, delay);
    });
    
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
        // If multiple product types selected, get recommendations for each
        const productTypesToRecommend = userData.productTypes || [];
        
        const recommended = getRecommendedProducts(
          {
            skinType: userData.skinType,
            age: userData.age,
            concerns: userData.concerns,
            productType: productTypesToRecommend[0] // Use first type for now
          },
          allProducts
        );
        
        setProducts(recommended);
        
        // Save to database
        await saveAnalysis(recommended);
      }
    } catch (error) {
      logError(error, 'loadRecommendations');
      // Fail silently to not disrupt user experience
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async (recommendedProducts: Product[]) => {
    try {
      // Create contact silently
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          name: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          skin_type: userData.skinType,
          age: userData.age,
          concerns: userData.concerns,
          product_type: userData.productTypes?.join(', '),
          additional_info: userData.additionalInfo
        })
        .select()
        .single();

      if (contactError) {
        logError(contactError, 'saveAnalysis-contact');
        return; // Fail silently
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
        }
      }
    } catch (error: any) {
      logError(error, 'saveAnalysis');
      // Fail silently, don't show error to user
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  const discountedValue = totalValue * 0.85;
  const savings = totalValue - discountedValue;

  const personalizedMessage = getPersonalizedMessage({
    skinType: userData.skinType,
    age: userData.age,
    concerns: userData.concerns,
    productType: userData.productTypes?.[0]
  });

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || "Altri";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categoryOrder = [
    "Detergente",
    "Tonico",
    "Siero",
    "Contorno Occhi",
    "Crema Viso",
    "Protezione Solare",
    "Maschera",
    "Altri"
  ];

  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5ebe0]">
        <Card className="p-8 bg-card/95 backdrop-blur shadow-xl">
          <p className="text-lg text-primary">Sto preparando la tua routine personalizzata... ✨</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 bg-[#f5ebe0]">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Back button */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={onRestart}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Torna all'inizio
          </Button>
        </div>

        {/* Header */}
        <Card id="results-header" className="p-6 sm:p-8 md:p-10 text-center space-y-4 sm:space-y-6 animate-fade-in bg-gradient-to-br from-[#f9f5f0] via-white to-[#f9f5f0] backdrop-blur border-2 border-primary/30 shadow-2xl">
          <div className="space-y-3">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-sm font-semibold text-primary">Analisi Completata ✓</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-scale-in leading-tight">
              La tua Routine Alma Personalizzata
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Abbiamo creato una routine su misura per te, basata sulle tue esigenze specifiche
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
            <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur border-2 border-primary/20 text-left hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="font-bold text-lg text-primary">Il tuo Profilo</h3>
              </div>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold min-w-[80px]">Nome:</span>
                  <span className="text-foreground break-words">{userData.fullName || userData.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold min-w-[80px]">Età:</span>
                  <span className="text-foreground">{userData.ageDisplay || `${userData.age} anni`}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold min-w-[80px]">Pelle:</span>
                  <span className="text-foreground capitalize">{userData.skinType}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur border-2 border-primary/20 text-left hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-bold text-lg text-primary">Le tue Esigenze</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {userData.concerns.map((concern, i) => (
                  <Badge key={i} className="text-xs sm:text-sm px-3 py-1.5 bg-gradient-to-r from-primary/80 to-accent/80 text-white border-0">
                    {concern}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          {userData.skinScores && (
            <Card className="p-3 sm:p-4 bg-primary/10 backdrop-blur border-primary/30">
              <h3 className="font-bold text-sm sm:text-base mb-3 text-center text-primary">🔬 Risultato Analisi AI</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-card/60 p-2 rounded text-center">
                  <div className="font-bold">💧 {userData.skinScores.idratazione}/10</div>
                  <div className="text-[10px] text-muted-foreground">Idratazione</div>
                </div>
                <div className="bg-card/60 p-2 rounded text-center">
                  <div className="font-bold">🎯 {userData.skinScores.elasticita}/10</div>
                  <div className="text-[10px] text-muted-foreground">Elasticità</div>
                </div>
                <div className="bg-card/60 p-2 rounded text-center">
                  <div className="font-bold">🌟 {userData.skinScores.pigmentazione}/10</div>
                  <div className="text-[10px] text-muted-foreground">Pigmentazione</div>
                </div>
                <div className="bg-card/60 p-2 rounded text-center">
                  <div className="font-bold">✨ {userData.skinScores.acne}/10</div>
                  <div className="text-[10px] text-muted-foreground">Acne</div>
                </div>
                <div className="bg-card/60 p-2 rounded text-center">
                  <div className="font-bold">⏱️ {userData.skinScores.rughe}/10</div>
                  <div className="text-[10px] text-muted-foreground">Rughe</div>
                </div>
                <div className="bg-card/60 p-2 rounded text-center">
                  <div className="font-bold">🔍 {userData.skinScores.pori}/10</div>
                  <div className="text-[10px] text-muted-foreground">Pori</div>
                </div>
                <div className="bg-card/60 p-2 rounded text-center">
                  <div className="font-bold">🌸 {userData.skinScores.rossore}/10</div>
                  <div className="text-[10px] text-muted-foreground">Rossore</div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 backdrop-blur border-2 border-primary/30 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💡</span>
              <div className="flex-1">
                <h4 className="font-bold text-base sm:text-lg text-primary mb-2">La nostra Raccomandazione</h4>
                <p className="text-sm sm:text-base text-foreground leading-relaxed">{personalizedMessage}</p>
              </div>
            </div>
          </Card>
        </Card>

        {/* Products Grouped by Category */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              I Tuoi Prodotti Consigliati
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {products.length} prodotti selezionati appositamente per te
            </p>
          </div>
          
          <div className="space-y-4">
            {sortedCategories.map(category => {
              const isExpanded = expandedCategories.has(category);
              const categoryProducts = groupedProducts[category];
              
              return (
                <div key={category} className="animate-fade-in">
                  <Card className="p-4 sm:p-6 bg-gradient-to-br from-white via-[#f9f5f0]/50 to-white backdrop-blur border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-shadow">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-primary/10">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl">
                          {category === "Detergente" && "🧴"}
                          {category === "Tonico" && "💧"}
                          {category === "Siero" && "✨"}
                          {category === "Contorno Occhi" && "👁️"}
                          {category === "Crema Viso" && "🌸"}
                          {category === "Protezione Solare" && "☀️"}
                          {category === "Maschera" && "🎭"}
                          {!["Detergente", "Tonico", "Siero", "Contorno Occhi", "Crema Viso", "Protezione Solare", "Maschera"].includes(category) && "💆"}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-primary">{category}</h3>
                      <Badge className="ml-auto bg-primary/10 text-primary border-primary/30">
                        {categoryProducts.length} {categoryProducts.length === 1 ? "prodotto" : "prodotti"}
                      </Badge>
                    </div>

                    <div className="grid gap-3 animate-fade-in">
                       {categoryProducts.map((product, index) => (
                        <div key={product.id} className="p-3 sm:p-4 bg-card/60 backdrop-blur rounded-lg border border-primary/10 hover:shadow-md transition-all">
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            {product.image_url && (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg"
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base sm:text-lg font-bold text-primary mb-1 break-words">{product.name}</h4>
                                  {product.description_short && (
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                      {product.description_short}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-lg sm:text-xl font-bold text-primary">€{product.price.toFixed(2)}</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {product.concerns_treated && product.concerns_treated.length > 0 && (
                                  <div className="bg-primary/5 p-2 rounded">
                                    <p className="font-semibold text-[10px] sm:text-xs mb-1">✓ Tratta:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {product.concerns_treated.slice(0, 3).map((concern, i) => (
                                        <Badge key={i} variant="secondary" className="text-[10px]">{concern}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {product.key_ingredients && product.key_ingredients.length > 0 && (
                                  <div className="bg-accent/5 p-2 rounded">
                                    <p className="font-semibold text-[10px] sm:text-xs mb-1">🧪 Ingredienti chiave:</p>
                                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                                      {product.key_ingredients.slice(0, 2).join(', ')}
                                    </p>
                                  </div>
                                )}

                                {product.how_to_use && (
                                  <div className="bg-secondary/20 p-2 rounded">
                                    <p className="font-semibold text-[10px] sm:text-xs mb-1">💡 Come usarlo:</p>
                                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                                      {product.how_to_use}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button asChild className="flex-1 text-xs">
                                  <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                                    <ShoppingCart className="w-3 h-3 mr-1" />
                                    Acquista
                                  </a>
                                </Button>
                                <Button asChild variant="outline" className="flex-1 text-xs">
                                  <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Dettagli
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Advisor Chat */}
        <AIAdvisorChat userData={userData} recommendedProducts={products} />

        {/* CTA */}
        <Card className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 animate-fade-in border-2 border-primary/30 shadow-xl backdrop-blur">
          <div className="space-y-4">
            <div className="inline-block bg-card/80 backdrop-blur px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-md">
              <p className="text-base sm:text-lg font-semibold">💰 <strong>VALORE TOTALE ROUTINE:</strong> €{totalValue.toFixed(2)}</p>
            </div>

            <div className="bg-card/80 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md border-2 border-primary/20">
              <p className="text-sm font-semibold text-primary mb-2">🌸 La tua routine personalizzata</p>
              <p className="text-xs text-muted-foreground">
                Completa il tuo acquisto su almanaturalbeauty.it
              </p>
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <Button size="lg" asChild className="w-full hover-scale bg-gradient-to-r from-primary to-accent shadow-xl text-base sm:text-lg py-5 sm:py-6">
            <a href="https://almanaturalbeauty.it" target="_blank" rel="noopener noreferrer">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              ACQUISTA ORA 🛍️✨
            </a>
          </Button>
        </Card>

        {/* Not Found Section */}
        <Card className="p-6 sm:p-8 text-center space-y-4 border-2 border-dashed border-primary/30 animate-fade-in bg-[#f9f5f0]/95 backdrop-blur">
          <h3 className="text-xl font-bold text-primary">🤔 Non hai trovato quello che cercavi?</h3>
          <p className="text-muted-foreground">
            Nessun problema! Ricomincia l'analisi per una nuova routine personalizzata
          </p>
          <Button onClick={onRestart} size="lg" variant="outline" className="hover-scale">
            <RotateCcw className="w-4 h-4 mr-2" />
            🔄 RICOMINCIA ANALISI
          </Button>
        </Card>
      </div>
    </div>
  );
};