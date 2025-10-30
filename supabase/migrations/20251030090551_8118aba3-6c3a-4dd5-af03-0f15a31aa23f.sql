-- Aggiungere colonna per ID prodotto WooCommerce
ALTER TABLE products 
ADD COLUMN woocommerce_id INTEGER;

-- Aggiungere commento esplicativo
COMMENT ON COLUMN products.woocommerce_id IS 'ID del prodotto nel sistema WooCommerce per l''integrazione carrello';