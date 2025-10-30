import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productIds } = await req.json();
    
    console.log('Received request to add to WooCommerce cart:', { productIds });

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Invalid or empty productIds array');
    }

    // Get WooCommerce configuration from environment
    const storeUrl = Deno.env.get('WOOCOMMERCE_STORE_URL');
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

    if (!storeUrl || !consumerKey || !consumerSecret) {
      console.error('Missing WooCommerce credentials');
      throw new Error('WooCommerce credentials not configured');
    }

    console.log('WooCommerce store URL:', storeUrl);

    // Validate that all product IDs are integers
    const validProductIds = productIds.filter(id => 
      typeof id === 'number' && Number.isInteger(id) && id > 0
    );

    if (validProductIds.length === 0) {
      throw new Error('No valid product IDs provided');
    }

    console.log('Valid product IDs:', validProductIds);

    // Optional: Verify products exist in WooCommerce
    // This step can be skipped for performance if you trust the product IDs
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    // Verify first product exists (quick validation)
    try {
      const verifyResponse = await fetch(
        `${storeUrl}/wp-json/wc/v3/products/${validProductIds[0]}`,
        { headers }
      );
      
      if (!verifyResponse.ok) {
        console.warn('Product verification failed:', await verifyResponse.text());
      } else {
        console.log('Product verification successful');
      }
    } catch (error) {
      console.warn('Error verifying product:', error);
      // Continue anyway - product might exist but API might have issues
    }

    // Build WooCommerce cart URL with redirect to cart page
    // Format: https://example.com/carrello/?add-to-cart=123&add-to-cart=456
    const cartParams = validProductIds
      .map(id => `add-to-cart=${id}`)
      .join('&');
    
    // Remove trailing slash from storeUrl to avoid double slashes
    const baseUrl = storeUrl.endsWith('/') ? storeUrl.slice(0, -1) : storeUrl;
    const cartUrl = `${baseUrl}/carrello/?${cartParams}`;
    
    console.log('Generated cart URL:', cartUrl);

    // Log action for analytics (optional)
    // You could save this to a 'cart_actions' table if needed

    return new Response(
      JSON.stringify({
        success: true,
        cartUrl,
        productsAdded: validProductIds.length,
        message: `${validProductIds.length} prodotti pronti per essere aggiunti al carrello`
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
