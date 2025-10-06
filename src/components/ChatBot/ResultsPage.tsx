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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
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
          additional_info: userData.additionalInfo,
          discount_code: discountCode
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-accent/10">
        <Card className="p-8">
          <p className="text-lg text-primary">Sto preparando la tua routine personalizzata... ✨</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 bg-gradient-to-br from-background via-secondary to-accent/10">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <Card className="p-4 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4 animate-fade-in">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary animate-scale-in leading-tight">
            ✨ Ecco la tua Routine Alma personalizzata, {userData.name}! ✨
          </h1>
          
          <Card className="p-4 sm:p-5 md:p-6 bg-secondary/50">
            <h3 className="font-bold text-base sm:text-lg mb-3">📋 IL TUO PROFILO COMPLETO</h3>
            <div className="grid sm:grid-cols-2 gap-2 sm:gap-3 text-left text-xs sm:text-sm">
              <p className="break-words">• <strong>Nome:</strong> {userData.fullName || userData.name}</p>
              <p>• <strong>Tipo di pelle:</strong> {userData.skinType}</p>
              <p>• <strong>Età:</strong> {userData.age} anni</p>
              <p className="break-all">• <strong>Email:</strong> {userData.email}</p>
              <p className="sm:col-span-2">• <strong>Preoccupazioni:</strong> {userData.concerns.join(', ')}</p>
              {userData.productTypes && userData.productTypes.length > 0 && (
                <p className="md:col-span-2">
                  • <strong>Prodotti selezionati:</strong>{' '}
                  {userData.productTypes.length === 1 && userData.productTypes[0] === "routine_completa" 
                    ? "Routine Completa" 
                    : userData.productTypes.map(t => t.replace(/_/g, ' ')).join(', ')}
                </p>
              )}
              {userData.skinScores && (
                <div className="sm:col-span-2 mt-2 pt-3 border-t">
                  <p className="font-semibold mb-2 text-xs sm:text-sm">🔬 Analisi AI della pelle:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                    <div className="bg-card/50 p-1.5 sm:p-2 rounded">💧 Idratazione: {userData.skinScores.idratazione}/10</div>
                    <div className="bg-card/50 p-1.5 sm:p-2 rounded">🎯 Elasticità: {userData.skinScores.elasticita}/10</div>
                    <div className="bg-card/50 p-1.5 sm:p-2 rounded">🌟 Pigmentazione: {userData.skinScores.pigmentazione}/10</div>
                    <div className="bg-card/50 p-1.5 sm:p-2 rounded">✨ Acne: {userData.skinScores.acne}/10</div>
                    <div className="bg-card/50 p-1.5 sm:p-2 rounded">⏱️ Rughe: {userData.skinScores.rughe}/10</div>
                    <div className="bg-card/50 p-1.5 sm:p-2 rounded">🔍 Pori: {userData.skinScores.pori}/10</div>
                    <div className="bg-card/50 p-1.5 sm:p-2 rounded">🌸 Rossore: {userData.skinScores.rossore}/10</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <p className="text-foreground">{personalizedMessage}</p>
        </Card>

        {/* Products Grouped by Category */}
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-4 sm:mb-6 text-center">
            🌸 LA TUA ROUTINE ALMA PERSONALIZZATA
          </h2>
          
          <p className="text-center text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base px-2">
            I prodotti sono organizzati per categoria per aiutarti a scegliere meglio in base alle tue esigenze! ✨
          </p>

          {userData.skinScores && (
            <Card className="p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 bg-secondary/30">
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-center">🎯 Priorità in base alla tua analisi:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                {Object.entries(userData.skinScores)
                  .filter(([_, score]: [string, any]) => score < 5)
                  .map(([key, score]: [string, any]) => {
                    const labels: Record<string, string> = {
                      idratazione: "💧 Idratazione",
                      elasticita: "🎈 Elasticità",
                      pigmentazione: "🎨 Pigmentazione",
                      acne: "🔴 Imperfezioni",
                      rughe: "📏 Anti-età",
                      pori: "⚫ Pori",
                      rossore: "🌡️ Sensibilità",
                    };
                    return (
                      <div key={key} className="bg-card p-3 rounded-lg border border-border">
                        <div className="font-semibold">{labels[key]}</div>
                        <div className="text-xs text-muted-foreground">{score}/10</div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}
          
          <div className="space-y-8">
            {sortedCategories.map(category => {
              const isExpanded = expandedCategories.has(category);
              const categoryProducts = groupedProducts[category];
              
              return (
                <div key={category} className="animate-fade-in">
                  <Button
                    variant="ghost"
                    onClick={() => toggleCategory(category)}
                    className="w-full justify-between p-3 sm:p-4 h-auto hover:bg-secondary/50 mb-2"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-2xl sm:text-3xl flex-shrink-0">
                        {category === "Detergente" && "🧴"}
                        {category === "Tonico" && "💧"}
                        {category === "Siero" && "✨"}
                        {category === "Contorno Occhi" && "👁️"}
                        {category === "Crema Viso" && "🌸"}
                        {category === "Protezione Solare" && "☀️"}
                        {category === "Maschera" && "🎭"}
                        {!["Detergente", "Tonico", "Siero", "Contorno Occhi", "Crema Viso", "Protezione Solare", "Maschera"].includes(category) && "💆"}
                      </span>
                      <div className="text-left min-w-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-primary">{category}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                          {category === "Detergente" && "Pulisci e prepara la pelle"}
                          {category === "Tonico" && "Riequilibra e tonifica"}
                          {category === "Siero" && "Trattamenti intensivi mirati"}
                          {category === "Contorno Occhi" && "Cura specifica per la zona delicata"}
                          {category === "Crema Viso" && "Idrata e protegge"}
                          {category === "Protezione Solare" && "Proteggi dai raggi UV"}
                          {category === "Maschera" && "Trattamenti intensivi settimanali"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">{categoryProducts.length}</Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                  </Button>

                  {isExpanded && (
                    <div className="grid gap-3 sm:gap-4 animate-fade-in">
                       {categoryProducts.map((product, index) => (
                        <Card key={product.id} className="p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all hover-scale bg-gradient-to-br from-card to-secondary/20 border-2 border-primary/10">
                          <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:gap-6">
                            {product.image_url && (
                              <div className="flex-shrink-0 relative group w-full md:w-56">
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full h-48 sm:h-56 object-cover rounded-lg bg-secondary/30 shadow-md"
                                />
                              </div>
                            )}
                            
                            <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                                <div className="space-y-1.5 sm:space-y-2 min-w-0 w-full sm:w-auto">
                                  <Badge variant="secondary" className="mb-1 sm:mb-2 bg-primary/20 text-primary border-primary/30 text-[10px] sm:text-xs">
                                    ⭐ RACCOMANDATO PER TE
                                  </Badge>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wide">{product.step}</p>
                                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text break-words">{product.name}</h3>
                                </div>
                                <div className="text-left sm:text-right bg-gradient-to-br from-primary/10 to-accent/10 p-3 sm:p-4 rounded-lg w-full sm:w-auto flex-shrink-0">
                                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Prezzo</p>
                                  <p className="text-2xl sm:text-3xl font-bold text-primary">€{product.price.toFixed(2)}</p>
                                  <p className="text-[10px] sm:text-xs text-green-600 font-semibold mt-1">-15% con ALMA15</p>
                                </div>
                              </div>

                              {product.description_short && (
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed bg-secondary/30 p-2.5 sm:p-3 rounded-lg">
                                  {product.description_short}
                                </p>
                              )}

                              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                                {product.key_ingredients && product.key_ingredients.length > 0 && (
                                  <div className="bg-gradient-to-br from-accent/5 to-primary/5 p-3 sm:p-4 rounded-lg border border-primary/10">
                                    <p className="font-bold text-xs sm:text-sm mb-2 flex items-center gap-2">
                                      <span className="text-base sm:text-lg">🧪</span> INGREDIENTI CHIAVE
                                    </p>
                                    <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 sm:space-y-1.5">
                                      {product.key_ingredients.slice(0, 3).map((ing, i) => (
                                        <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                                          <span className="text-primary flex-shrink-0">•</span>
                                          <span className="break-words">{ing}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {product.concerns_treated && product.concerns_treated.length > 0 && (
                                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-3 sm:p-4 rounded-lg border border-primary/10">
                                    <p className="font-bold text-xs sm:text-sm mb-2 flex items-center gap-2">
                                      <span className="text-base sm:text-lg">✓</span> PROBLEMATICHE RISOLTE
                                    </p>
                                    <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 sm:space-y-1.5">
                                      {product.concerns_treated.slice(0, 4).map((concern, i) => (
                                        <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                                          <span className="text-primary flex-shrink-0">✓</span>
                                          <span className="break-words">{concern}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {product.how_to_use && (
                                <div className="bg-secondary/40 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                                  <p className="font-bold text-xs sm:text-sm mb-2 flex items-center gap-2 text-primary">
                                    <span className="text-base sm:text-lg">💡</span> COME USARLO
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{product.how_to_use}</p>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                                <Button asChild className="flex-1 hover-scale bg-gradient-to-r from-primary to-primary/80 shadow-md text-xs sm:text-sm">
                                  <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">Acquista ora</span>
                                    <span className="xs:hidden">Acquista</span>
                                  </a>
                                </Button>
                                <Button asChild variant="outline" className="flex-1 hover-scale text-xs sm:text-sm">
                                  <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">Vedi dettagli</span>
                                    <span className="xs:hidden">Dettagli</span>
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Advisor Chat */}
        <AIAdvisorChat userData={userData} recommendedProducts={products} />

        {/* Discount & CTA */}
        <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 animate-fade-in border-2 border-primary/30 shadow-xl">
          <div className="space-y-4">
            <div className="inline-block bg-card px-6 py-3 rounded-full shadow-md">
              <p className="text-lg font-semibold">💰 <strong>VALORE TOTALE ROUTINE:</strong> €{totalValue.toFixed(2)}</p>
            </div>
            
            <div className="bg-gradient-to-r from-primary to-accent p-6 rounded-2xl shadow-lg">
              <p className="text-white/90 text-sm mb-2 font-medium">🎁 CON IL TUO CODICE SCONTO ESCLUSIVO 15%</p>
              <p className="text-4xl font-bold text-white mb-2">
                €{discountedValue.toFixed(2)}
              </p>
              <p className="text-green-100 font-bold text-lg">
                ✨ RISPARMI €{savings.toFixed(2)}!
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-md border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-3">Il tuo codice sconto personale:</p>
              <div className="relative">
                <Badge variant="secondary" className="text-2xl py-4 px-8 bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/40">
                  <strong className="text-primary">{discountCode}</strong>
                </Badge>
                <p className="text-xs text-muted-foreground mt-3">
                  Inseriscilo al checkout su almanaturalbeauty.it
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <Button size="lg" asChild className="w-full hover-scale bg-gradient-to-r from-primary to-accent shadow-xl text-lg py-6">
            <a href="https://almanaturalbeauty.it" target="_blank" rel="noopener noreferrer">
              <ShoppingCart className="w-6 h-6 mr-3" />
              ACQUISTA ORA CON -15% 🛍️✨
            </a>
          </Button>
        </Card>

        {/* Not Found Section */}
        <Card className="p-8 text-center space-y-4 border-2 border-dashed border-primary/30 animate-fade-in">
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