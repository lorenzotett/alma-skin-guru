import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track requests per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(clientIP);
  
  if (!limit || now > limit.resetAt) {
    // Reset or create new limit: 10 requests per minute
    rateLimitMap.set(clientIP, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }
  
  if (limit.count >= 10) {
    const retryAfter = Math.ceil((limit.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  limit.count++;
  return { allowed: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIP);
    
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Troppi tentativi. Riprova tra qualche minuto.'
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitCheck.retryAfter || 60)
          },
          status: 429,
        }
      );
    }

    const { productIds } = await req.json();
    
    

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Invalid or empty productIds array');
    }

    // Get WooCommerce configuration from environment
    const storeUrl = Deno.env.get('WOOCOMMERCE_STORE_URL');
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

    console.log('WooCommerce credentials check:', {
      hasStoreUrl: !!storeUrl,
      hasConsumerKey: !!consumerKey,
      hasConsumerSecret: !!consumerSecret,
      storeUrlValue: storeUrl // Log the actual URL to help debug
    });

    if (!storeUrl || !consumerKey || !consumerSecret) {
      console.error('Missing WooCommerce credentials:', {
        storeUrl: !!storeUrl,
        consumerKey: !!consumerKey,
        consumerSecret: !!consumerSecret
      });
      throw new Error('Configurazione WooCommerce mancante. Verifica le credenziali nel pannello segreti.');
    }

    

    // Quick validation: filter valid product IDs
    const validProductIds = productIds.filter(id => 
      typeof id === 'number' && Number.isInteger(id) && id > 0
    );

    if (validProductIds.length === 0) {
      throw new Error('No valid product IDs provided');
    }

    // Verify products exist in our database and are active
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: validProducts, error: dbError } = await supabase
      .from('products')
      .select('woocommerce_id')
      .in('woocommerce_id', validProductIds)
      .eq('active', true);

    if (dbError) {
      console.error('Database error verifying products:', dbError);
      throw new Error('Errore durante la verifica dei prodotti');
    }

    if (!validProducts || validProducts.length === 0) {
      throw new Error('Nessun prodotto valido trovato');
    }

    // Only use verified product IDs
    const verifiedProductIds = validProducts.map(p => p.woocommerce_id);

    // Validate and normalize store URL
    let baseUrl = storeUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    console.log('Creating WooCommerce cart with products:', verifiedProductIds);
    console.log('Store URL from env:', storeUrl);
    console.log('Normalized base URL:', baseUrl);
    
    // Try to use WooCommerce REST API to add products to cart
    // This requires authentication with consumer key and secret
    try {
      // Encode credentials for Basic Auth
      const auth = btoa(`${consumerKey}:${consumerSecret}`);
      
      // Try to add products using WooCommerce REST API
      // Note: This endpoint might not be available on all WooCommerce installations
      for (const productId of verifiedProductIds) {
        const apiUrl = `${baseUrl}/wp-json/wc/v3/products/${productId}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          console.log(`Product ${productId} verified via API`);
        } else {
          console.warn(`Could not verify product ${productId} via API:`, response.status);
        }
      }
    } catch (apiError) {
      console.error('Error using WooCommerce API:', apiError);
    }
    
    // Generate cart URL - WooCommerce uses 'add-to-cart' parameter for each product
    // For multiple products, we can chain them or use a redirect approach
    // The most reliable method is to use the format: ?add-to-cart=ID1&add-to-cart=ID2
    // However, some themes/plugins support add-to-cart[] array notation
    let cartUrl: string;
    
    if (verifiedProductIds.length === 1) {
      // Single product - simple approach
      cartUrl = `${baseUrl}/carrello/?add-to-cart=${verifiedProductIds[0]}`;
    } else {
      // Multiple products - try array notation first, fallback to comma-separated
      // Some WooCommerce installations support this format
      const productParams = verifiedProductIds.map(id => `add-to-cart[]=${id}`).join('&');
      cartUrl = `${baseUrl}/carrello/?${productParams}`;
    }
    
    console.log('Generated cart URL:', cartUrl);
    console.log('Product count:', verifiedProductIds.length);
    console.log('Product IDs being added:', verifiedProductIds);
    
    // Return the cart URL - the client will handle the redirect
    return new Response(
      JSON.stringify({
        success: true,
        cartUrl: cartUrl,
        productsAdded: verifiedProductIds.length,
        message: `${verifiedProductIds.length} prodotti verranno aggiunti al carrello`,
        debug: {
          storeUrl: baseUrl,
          productIds: verifiedProductIds
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in add-to-woo-cart function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: 'Errore durante la preparazione del carrello'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
