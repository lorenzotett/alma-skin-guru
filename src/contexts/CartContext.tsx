import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface CartProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  product_url: string;
  image_url?: string;
  description_short?: string;
  brand?: string;
  woocommerce_id?: number;
}

interface CartContextType {
  cartItems: CartProduct[];
  cartCount: number;
  addToCart: (product: CartProduct) => Promise<void>;
  addMultipleToCart: (products: CartProduct[]) => Promise<void>;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isLoading: boolean;
  getTotalPrice: () => number;
  shouldOpenCart: boolean;
  setShouldOpenCart: (value: boolean) => void;
  showCart: boolean;
  setShowCart: (value: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'alma_cart_items';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldOpenCart, setShouldOpenCart] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  const addToCart = async (product: CartProduct) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCartItems(prev => {
        // Check if product already in cart
        const exists = prev.find(item => item.id === product.id);
        if (exists) {
          toast.info('Prodotto già nel carrello');
          return prev;
        }
        
        toast.success(`${product.name} aggiunto al carrello!`, {
          duration: 2000,
        });
        
        setShouldOpenCart(true);
        return [...prev, product];
      });
      
    } catch (error) {
      toast.error('Errore nell\'aggiunta al carrello. Riprova.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addMultipleToCart = async (products: CartProduct[]) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCartItems(prev => {
        // Add only products not already in cart
        const existingIds = new Set(prev.map(item => item.id));
        const newProducts = products.filter(p => !existingIds.has(p.id));
        
        if (newProducts.length === 0) {
          toast.info('Tutti i prodotti sono già nel carrello');
          return prev;
        }
        
        toast.success(`${newProducts.length} prodotti aggiunti al carrello!`, {
          duration: 2000,
        });
        
        setShouldOpenCart(true);
        return [...prev, ...newProducts];
      });
      
    } catch (error) {
      toast.error('Errore nell\'aggiunta dei prodotti. Riprova.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => {
      const filtered = prev.filter(item => item.id !== productId);
      toast.success('Prodotto rimosso dal carrello');
      return filtered;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Carrello svuotato');
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  };

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        clearCart,
        isLoading,
        getTotalPrice,
        shouldOpenCart,
        setShouldOpenCart,
        showCart,
        setShowCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
