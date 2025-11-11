import { useEffect, useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, ShoppingCart, RotateCcw, Check, Plus, Package, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRecommendedProducts, getPersonalizedMessage, type Product } from "@/lib/productRecommendations";
import { logError } from "@/lib/errorHandler";
import { AIAdvisorChat } from "./AIAdvisorChat";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  onEditData?: (step: string) => void;
  onBack?: () => void;
}

export const ResultsPage = ({ userData, onRestart, onEditData, onBack }: ResultsPageProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  
  const { addToCart, cartCount, cartItems, clearCart, isLoading: cartLoading, setShowCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Aggressive scroll to top with multiple attempts
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Multiple retry attempts to ensure it works
    setTimeout(scrollToTop, 50);
    setTimeout(scrollToTop, 100);
    setTimeout(scrollToTop, 200);
    setTimeout(scrollToTop, 500);
    
    // Show the cart when results page loads
    setShowCart(true);
    loadRecommendations();
  }, [setShowCart]);

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
      // Create contact without authentication (RLS policies allow public insert)
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
        })
        .select()
        .single();

      if (contactError) {
        console.error('Error saving contact:', contactError);
        // Check for specific error codes
        if (contactError.code === '23505') {
          // Duplicate entry - this is OK, user might have done analysis before
          console.log('Contact already exists, continuing...');
        } else if (contactError.message?.includes('rate limit')) {
          toast.error('Troppi tentativi. Riprova tra un\'ora.');
        } else {
          // Other errors - fail silently but log
          logError(contactError, 'saveAnalysis-contact');
        }
        return;
      }

      // Link products to contact if contact was created successfully
      if (contact && recommendedProducts.length > 0) {
        const contactProducts = recommendedProducts.map(p => ({
          contact_id: contact.id,
          product_id: p.id
        }));

        const { error: productsError } = await supabase
          .from('contact_products')
          .insert(contactProducts);

        if (productsError) {
          console.error('Error linking products:', productsError);
          logError(productsError, 'saveAnalysis-products');
        }
      }
    } catch (error: any) {
      console.error('Error in saveAnalysis:', error);
      logError(error, 'saveAnalysis');
      // Fail silently - don't disrupt user experience
    }
  };


  // Handler for redirecting to product page
  const handleViewProduct = (productUrl: string) => {
    window.open(productUrl, '_blank');
  };

  // Handler for adding a single product to local cart
  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        product_url: product.product_url,
        image_url: product.image_url,
        description_short: product.description_short,
        brand: product.brand,
        woocommerce_id: product.woocommerce_id
      });
      setAddedProducts(prev => new Set(prev).add(product.id));
    } catch (error) {
      console.error('Error adding to local cart:', error);
    }
  };

  // Handler for buying all products at once
  const handleBuyAllNow = async () => {
    const productsWithWoo = products.filter(p => p.woocommerce_id);
    
    if (productsWithWoo.length === 0) {
      toast.error('Nessun prodotto disponibile per l\'acquisto');
      return;
    }

    toast.loading('Preparazione carrello...', { id: 'buy-all' });

    try {
      const { data, error } = await supabase.functions.invoke('add-to-woo-cart', {
        body: {
          productIds: productsWithWoo.map(p => p.woocommerce_id)
        }
      });

      if (error) {
        console.error('Error calling add-to-woo-cart function:', error);
        toast.error('Errore durante l\'aggiunta al carrello', { id: 'buy-all' });
        return;
      }

      if (data?.success && data?.productUrls && data?.productUrls.length > 0) {
        // Create a URL with all products concatenated using commas
        const allProductIds = productsWithWoo.map(p => p.woocommerce_id).join(',');
        const bulkAddUrl = `${data.productUrls[0].url.split('?')[0]}?add-to-cart=${allProductIds}`;
        
        toast.success('Reindirizzamento al carrello...', { id: 'buy-all' });
        
        // Open directly - WooCommerce will handle the comma-separated IDs
        window.open(bulkAddUrl, '_blank');
      } else {
        toast.error('Errore durante l\'aggiunta al carrello', { id: 'buy-all' });
      }
    } catch (error) {
      console.error('Error in buy all:', error);
      toast.error('Errore durante l\'aggiunta al carrello', { id: 'buy-all' });
    }
  };

  // Handler for checking out with selected products from local cart
  const handleCheckoutFromLocalCart = async () => {
    const cartProductsWithWoo = cartItems.filter(p => p.woocommerce_id);
    
    if (cartProductsWithWoo.length === 0) {
      toast.error('Nessun prodotto nel carrello');
      return;
    }

    toast.loading('Preparazione carrello...', { id: 'checkout' });

    try {
      const { data, error } = await supabase.functions.invoke('add-to-woo-cart', {
        body: {
          productIds: cartProductsWithWoo.map(p => p.woocommerce_id)
        }
      });

      if (error) {
        console.error('Error calling add-to-woo-cart function:', error);
        toast.error('Errore durante l\'aggiunta al carrello', { id: 'checkout' });
        return;
      }

      if (data?.success && data?.productUrls && data?.productUrls.length > 0) {
        // Create a URL with all products concatenated using commas
        const allProductIds = cartProductsWithWoo.map(p => p.woocommerce_id).join(',');
        const bulkAddUrl = `${data.productUrls[0].url.split('?')[0]}?add-to-cart=${allProductIds}`;
        
        // Clear local cart
        clearCart();
        
        toast.success('Reindirizzamento al carrello...', { id: 'checkout' });
        
        // Open directly - WooCommerce will handle the comma-separated IDs
        window.open(bulkAddUrl, '_blank');
      } else {
        toast.error('Errore durante l\'aggiunta al carrello', { id: 'checkout' });
      }
    } catch (error) {
      console.error('Error in checkout:', error);
      toast.error('Errore durante l\'aggiunta al carrello', { id: 'checkout' });
    }
  };


  const totalValue = useMemo(() => 
    products.reduce((sum, p) => sum + p.price, 0), 
    [products]
  );

  const personalizedMessage = useMemo(() => 
    getPersonalizedMessage({
      skinType: userData.skinType,
      age: userData.age,
      concerns: userData.concerns,
      productType: userData.productTypes?.[0]
    }),
    [userData.skinType, userData.age, userData.concerns, userData.productTypes]
  );

  // Group products by category - memoized
  const groupedProducts = useMemo(() => 
    products.reduce((acc, product) => {
      const category = product.category || "Altri";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>),
    [products]
  );

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

  const sortedCategories = useMemo(() => 
    Object.keys(groupedProducts).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    }),
    [groupedProducts]
  );

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

        {/* Back Button */}
        {onBack && (
          <div className="flex justify-start">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="gap-2 border-2 border-primary/40 hover:bg-primary/10 hover:border-primary/60 shadow-md hover:shadow-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Torna all'Ultimo Passaggio
            </Button>
          </div>
        )}

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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-semibold min-w-[80px]">Età:</span>
                    <span className="text-foreground">{userData.ageDisplay || `${userData.age} anni`}</span>
                  </div>
                  {onEditData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditData('age')}
                      className="text-xs h-auto py-1 px-2 text-primary hover:text-primary/80"
                    >
                      ✏️ Modifica
                    </Button>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-semibold min-w-[80px]">Pelle:</span>
                    <span className="text-foreground capitalize">{userData.skinType}</span>
                  </div>
                  {onEditData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditData('skin-type')}
                      className="text-xs h-auto py-1 px-2 text-primary hover:text-primary/80"
                    >
                      ✏️ Modifica
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur border-2 border-primary/20 text-left hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-bold text-lg text-primary">Le tue Esigenze</h3>
                </div>
                {onEditData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditData('concerns')}
                    className="text-xs h-auto py-1 px-2 text-primary hover:text-primary/80"
                  >
                    ✏️ Modifica
                  </Button>
                )}
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
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur border-2 border-primary/30">
              <h3 className="font-bold text-base sm:text-lg mb-4 text-center text-primary flex items-center justify-center gap-2">
                <span className="text-2xl">🔬</span>
                Risultato Analisi AI della Pelle
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-card/80 p-3 sm:p-4 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-1">💧 {userData.skinScores.idratazione}/10</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">Idratazione</div>
                  {userData.skinScores.idratazione < 7 && (
                    <div className="text-[10px] sm:text-xs text-accent mt-1">⚠️ Da migliorare</div>
                  )}
                </div>
                <div className="bg-card/80 p-3 sm:p-4 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-1">🎯 {userData.skinScores.elasticita}/10</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">Elasticità</div>
                  {userData.skinScores.elasticita < 7 && (
                    <div className="text-[10px] sm:text-xs text-accent mt-1">⚠️ Da migliorare</div>
                  )}
                </div>
                <div className="bg-card/80 p-3 sm:p-4 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-1">🌟 {userData.skinScores.pigmentazione}/10</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">Pigmentazione</div>
                  {userData.skinScores.pigmentazione < 7 && (
                    <div className="text-[10px] sm:text-xs text-accent mt-1">⚠️ Da migliorare</div>
                  )}
                </div>
                <div className="bg-card/80 p-3 sm:p-4 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-1">✨ {userData.skinScores.acne}/10</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">Acne</div>
                  {userData.skinScores.acne < 7 && (
                    <div className="text-[10px] sm:text-xs text-accent mt-1">⚠️ Da migliorare</div>
                  )}
                </div>
                <div className="bg-card/80 p-3 sm:p-4 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-1">⏱️ {userData.skinScores.rughe}/10</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">Rughe</div>
                  {userData.skinScores.rughe < 7 && (
                    <div className="text-[10px] sm:text-xs text-accent mt-1">⚠️ Da migliorare</div>
                  )}
                </div>
                <div className="bg-card/80 p-3 sm:p-4 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-1">🔍 {userData.skinScores.pori}/10</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">Pori</div>
                  {userData.skinScores.pori < 7 && (
                    <div className="text-[10px] sm:text-xs text-accent mt-1">⚠️ Da migliorare</div>
                  )}
                </div>
                <div className="bg-card/80 p-3 sm:p-4 rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-1">🌸 {userData.skinScores.rossore}/10</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">Rossore</div>
                  {userData.skinScores.rossore < 7 && (
                    <div className="text-[10px] sm:text-xs text-accent mt-1">⚠️ Da migliorare</div>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 backdrop-blur border-2 border-primary/30 shadow-lg">
            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-3xl">💡</span>
              <div className="flex-1 w-full">
                <h4 className="font-bold text-base sm:text-lg text-primary mb-2">La nostra Raccomandazione</h4>
                <p className="text-sm sm:text-base text-foreground leading-relaxed">{personalizedMessage}</p>
              </div>
            </div>
          </Card>
        </Card>

        {/* Buy All Button */}
        {products.filter(p => p.woocommerce_id).length > 0 && (
          <Card className="p-6 sm:p-8 text-center space-y-4 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 animate-fade-in border-2 border-primary/40 shadow-2xl backdrop-blur">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Package className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary">Routine Completa</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-primary">
                Acquista tutti i prodotti consigliati
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Aggiungi tutti i {products.filter(p => p.woocommerce_id).length} prodotti al carrello in un clic e completa il tuo acquisto su almanaturalbeauty.it
              </p>
              <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-bold text-primary pt-2">
                <span>Valore totale:</span>
                <span className="text-2xl sm:text-3xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  €{totalValue.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleBuyAllNow}
                size="lg" 
                className="flex-1 sm:w-auto px-8 sm:px-12 py-6 sm:py-7 text-lg sm:text-xl font-bold hover-scale bg-gradient-to-r from-primary via-accent to-primary shadow-2xl hover:shadow-3xl transition-all"
              >
                <ShoppingCart className="w-6 h-6 mr-3" />
                ACQUISTA TUTTO ORA 🛍️✨
              </Button>
              
              {cartCount > 0 && (
                <Button
                  onClick={handleCheckoutFromLocalCart}
                  size="lg"
                  className="flex-1 sm:w-auto px-8 sm:px-12 py-6 sm:py-7 text-lg sm:text-xl font-bold hover-scale bg-accent hover:bg-accent/90 shadow-2xl hover:shadow-3xl transition-all"
                >
                  <ShoppingCart className="w-6 h-6 mr-3" />
                  VAI AL CARRELLO ({cartCount})
                </Button>
              )}
            </div>
          </Card>
        )}

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
          
          <div className="space-y-6">
            {sortedCategories.map(category => {
              const categoryProducts = groupedProducts[category];
              
              return (
                <div key={category} className="animate-fade-in">
                  <Card className="p-4 sm:p-6 bg-gradient-to-br from-white via-[#f9f5f0]/50 to-white backdrop-blur border-2 border-primary/20 shadow-xl">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-primary/10">
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

                    <div className="grid gap-4 sm:gap-5">
                      {categoryProducts.map((product, index) => (
                        <div key={product.id} className="p-4 sm:p-5 bg-gradient-to-br from-white to-primary/5 backdrop-blur rounded-xl border-2 border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {product.image_url && (
                              <div className="relative group">
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full sm:w-28 h-36 sm:h-28 object-cover rounded-xl border-2 border-primary/10 group-hover:border-primary/30 transition-all"
                                />
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-lg sm:text-xl text-primary break-words leading-tight">{product.name}</h4>
                                    {product.woocommerce_id && (
                                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                        ✓ Disponibile
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground font-medium">{product.brand}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-2xl font-bold bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent">
                                    €{product.price.toFixed(2)}
                                  </p>
                                  {product.step && (
                                    <Badge variant="outline" className="text-xs mt-1 border-primary/30">
                                      {product.step}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {product.description_short && (
                                <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2">{product.description_short}</p>
                              )}
                              
                              {/* Match with concerns and skin scores */}
                              {product.concerns_treated && product.concerns_treated.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-primary">🎯 Tratta:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {product.concerns_treated.map((concern, i) => {
                                      const isUserConcern = userData.concerns.some(uc => 
                                        uc.toLowerCase().includes(concern.toLowerCase()) || 
                                        concern.toLowerCase().includes(uc.toLowerCase())
                                      );
                                      return (
                                        <Badge 
                                          key={i} 
                                          className={`text-xs px-3 py-1 ${
                                            isUserConcern 
                                              ? 'bg-gradient-to-r from-accent to-primary text-white border-0 shadow-md' 
                                              : 'bg-secondary text-secondary-foreground'
                                          }`}
                                        >
                                          {isUserConcern && '✓ '}{concern}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                               <div className="flex gap-2 pt-3">
                                 {product.woocommerce_id ? (
                                   <>
                                     <Button
                                       onClick={() => handleAddToCart(product)}
                                       disabled={cartLoading || addedProducts.has(product.id)}
                                       className="flex-1 gap-2 h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 disabled:opacity-60"
                                     >
                                       {addedProducts.has(product.id) ? (
                                         <>
                                           <Check className="w-5 h-5" />
                                           Aggiunto
                                         </>
                                       ) : (
                                         <>
                                           <Plus className="w-5 h-5" />
                                           Aggiungi al Carrello
                                         </>
                                       )}
                                     </Button>
                                     <Button
                                       onClick={() => handleViewProduct(product.product_url)}
                                       variant="outline"
                                       className="gap-2 h-11 text-base font-semibold border-2 border-primary/30 hover:border-primary/60"
                                     >
                                       <ExternalLink className="w-5 h-5" />
                                     </Button>
                                   </>
                                 ) : (
                                   <Button
                                     onClick={() => handleViewProduct(product.product_url)}
                                     className="flex-1 gap-2 h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90"
                                   >
                                     <ExternalLink className="w-5 h-5" />
                                     Vai al Prodotto
                                   </Button>
                                 )}
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
            <div className="bg-card/80 backdrop-blur p-4 sm:p-6 rounded-xl shadow-md border-2 border-primary/20">
              <p className="text-sm font-semibold text-primary mb-2">🌸 La tua routine personalizzata</p>
              <p className="text-xs text-muted-foreground">
                Completa il tuo acquisto su almanaturalbeauty.it
              </p>
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <Button size="lg" asChild className="w-full hover-scale bg-gradient-to-r from-primary to-accent shadow-xl text-base sm:text-lg py-5 sm:py-6">
            <a href="https://almanaturalbeauty.it/shop/" target="_blank" rel="noopener noreferrer">
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