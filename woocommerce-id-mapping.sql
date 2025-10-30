-- Script SQL per mappare gli ID WooCommerce ai prodotti Lovable
-- Eseguire tramite backend Lovable → SQL Editor

-- Mappatura basata sul CSV WooCommerce fornito
UPDATE products SET woocommerce_id = 1448 WHERE name ILIKE '%Acido Ialuronico Puro Molecolare%';
UPDATE products SET woocommerce_id = 1758 WHERE name ILIKE '%Attivatore Melaninico%';
UPDATE products SET woocommerce_id = 316 WHERE name ILIKE '%Bio Gel Detergente Viso%';
UPDATE products SET woocommerce_id = 1495 WHERE name ILIKE '%Bio Olio Detergente Viso%';
UPDATE products SET woocommerce_id = 1444 WHERE name ILIKE '%Burro Perfect Lips%';
UPDATE products SET woocommerce_id = 312 WHERE name ILIKE '%Contorno Occhi e Labbra%';
UPDATE products SET woocommerce_id = 307 WHERE name ILIKE '%Crema Acidi H24%';
UPDATE products SET woocommerce_id = 1626 WHERE name ILIKE '%Crema Corpo No-Age%';
UPDATE products SET woocommerce_id = 1763 WHERE name ILIKE '%Crema Corpo Doposole%';
UPDATE products SET woocommerce_id = 1511 WHERE name ILIKE '%Crema Giorno No-Age%';
UPDATE products SET woocommerce_id = 314 WHERE name ILIKE '%Crema Lipo Cell Caffè Verde%';
UPDATE products SET woocommerce_id = 1647 WHERE name ILIKE '%Crema Mani No-Age%';
UPDATE products SET woocommerce_id = 1516 WHERE name ILIKE '%Crema Notte No-Age%';
UPDATE products SET woocommerce_id = 1520 WHERE name ILIKE '%Crema Viso Giorno Rosa Canina%';
UPDATE products SET woocommerce_id = 1525 WHERE name ILIKE '%Crema Viso Notte Fiordaliso%';
UPDATE products SET woocommerce_id = 313 WHERE name ILIKE '%Crema Viso 50+ con Niacinamide%';
UPDATE products SET woocommerce_id = 1617 WHERE name ILIKE '%Detergente Corpo%';
UPDATE products SET woocommerce_id = 1454 WHERE name ILIKE '%Elisir al Bio Melograno%';
UPDATE products SET woocommerce_id = 1613 WHERE name ILIKE '%Esfoliante Corpo%';
UPDATE products SET woocommerce_id = 1436 WHERE name ILIKE '%Esfoliante Viso Delicato%';
UPDATE products SET woocommerce_id = 1602 WHERE name ILIKE '%Fluido Acidi%';
UPDATE products SET woocommerce_id = 1638 WHERE name ILIKE '%Fresh Dren Gambe%';
UPDATE products SET woocommerce_id = 1487 WHERE name ILIKE '%Guantino Esfoliante Acido Salicilico%';
UPDATE products SET woocommerce_id = 317 WHERE name ILIKE '%Latte Detergente%';
UPDATE products SET woocommerce_id = 305 WHERE name ILIKE '%Maschera Globale%';
UPDATE products SET woocommerce_id = 1695 WHERE name ILIKE '%Maschera Gold Biobotox%';
UPDATE products SET woocommerce_id = 1687 WHERE name ILIKE '%Maschera TNT Collagene%';
UPDATE products SET woocommerce_id = 1679 WHERE name ILIKE '%Maschera TNT Ialuronico%' AND name NOT ILIKE '%Peptidi%';
UPDATE products SET woocommerce_id = 1467 WHERE name ILIKE '%Maschera TNT Ialuronico e Peptidi%';
UPDATE products SET woocommerce_id = 1634 WHERE name ILIKE '%Mousse Vellutante ai Fiori di Loto%';
UPDATE products SET woocommerce_id = 1425 WHERE name ILIKE '%Mousse Detergente Viso%';
UPDATE products SET woocommerce_id = 1742 WHERE name ILIKE '%Olio Essenziali Lavanda%';
UPDATE products SET woocommerce_id = 1738 WHERE name ILIKE '%Olio Essenziali Iperico%';
UPDATE products SET woocommerce_id = 1750 WHERE name ILIKE '%Olio Essenziale Fucus%';
UPDATE products SET woocommerce_id = 1754 WHERE name ILIKE '%Olio Essenziale Ginepro%';
UPDATE products SET woocommerce_id = 1746 WHERE name ILIKE '%Olio Essenziale Salvia%';
UPDATE products SET woocommerce_id = 1620 WHERE name ILIKE '%Olio Puro%';
UPDATE products SET woocommerce_id = 315 WHERE name ILIKE '%Patch Occhi Gold BioBotox%';
UPDATE products SET woocommerce_id = 1691 WHERE name ILIKE '%Patch Labbra Gold Biobotox%';
UPDATE products SET woocommerce_id = 1500 WHERE name ILIKE '%Peeling Viso/Corpo alla Jojoba%';
UPDATE products SET woocommerce_id = 1642 WHERE name ILIKE '%RITUALE MANI E PIEDI PROPOLI%';
UPDATE products SET woocommerce_id = 1608 WHERE name ILIKE '%Siero Acidi%';
UPDATE products SET woocommerce_id = 1507 WHERE name ILIKE '%Siero Intensivo%';
UPDATE products SET woocommerce_id = 1431 WHERE name ILIKE '%Tonico Spray%';

-- Verifica mapping completato
SELECT 
  name,
  woocommerce_id,
  product_url,
  CASE 
    WHEN woocommerce_id IS NULL THEN '❌ Non mappato'
    ELSE '✅ Mappato'
  END as status
FROM products 
WHERE active = true
ORDER BY status, name;
