// Enhanced Product Recommendation System - Alma Natural Beauty
// Intelligently matches products based on user's specific concerns and skin type

export interface Product {
  id: string;
  name: string;
  category: string;
  step: string;
  price: number;
  description_short?: string;
  description_long?: string;
  product_url: string;
  image_url?: string;
  key_ingredients?: string[];
  concerns_treated?: string[];
  skin_types?: string[];
  how_to_use?: string;
  inci?: string;
  brand?: string;
}

export interface UserProfile {
  skinType: string;
  age: number;
  concerns: string[];
  productType?: string;
}

// Mappatura tra concerns dell'utente e nomenclatura database prodotti
const CONCERN_MAP: { [key: string]: string[] } = {
  // Acne e imperfezioni
  'acne': ['Acne', 'Texture uniforme', 'Pori dilatati', 'Oleosità', 'Eccesso di sebo', 'Impurità'],
  
  // Rughe e invecchiamento
  'rughe': ['Rughe', 'Elasticità', 'Invecchiamento', 'Perdita di tono', 'Pelle poco tonica o rilassata'],
  
  // Rossori e sensibilità
  'rossori': ['Rossori', 'Pelle sensibile o irritata', 'Secchezza cutanea', 'Stanchezza e stress cutaneo'],
  
  // Pigmentazione e macchie
  'pigmentazione': ['Pigmentazione', 'Macchie e discromie', 'Viso spento'],
  
  // Occhiaie
  'occhiaie': ['Occhiaie'],
  
  // Pori dilatati
  'pori_dilatati': ['Pori dilatati', 'Texture uniforme'],
  
  // Elasticità e tonicità
  'elasticita': ['Elasticità', 'Perdita di tono', 'Pelle poco tonica o rilassata', 'Perdita di volume e definizione'],
  
  // Idratazione
  'idratazione': ['Idratazione', 'Pelle secca', 'Secchezza cutanea', 'Labbra secche e screpolate'],
  
  // Cellulite e ritenzione
  'cellulite': ['Cellulite', 'Ritenzione idrica e gonfiore', 'Adiposità localizzate'],
  
  // Altri
  'pelle_morta': ['Cellule morte', 'Pelle ruvida'],
  'danni_solari': ['Danni solari']
};

// Mappatura tipo di pelle - ora include "Tutte"
const SKIN_TYPE_MAP: { [key: string]: string[] } = {
  'secca': ['Secca', 'Normale', 'Tutte'],
  'grassa': ['Grassa', 'Oleosa', 'Acneica', 'Tutte'],
  'mista': ['Mista', 'Normale', 'Tutte'],
  'normale': ['Normale', 'Mista', 'Secca', 'Tutte'],
  'asfittica': ['Asfittica', 'Acneica', 'Tutte'],
  'sensibile': ['Sensibile', 'Tutte'],
  'matura': ['Matura', 'Tutte']
};

// Ordine preciso della beauty routine (dalle regole del database)
const ROUTINE_ORDER = [
  '1. Detergente',
  '2. Tonico',
  '3. Siero',
  '4. Crema',
  '5. Maschera',
  '7. Olio'
];

export function getRecommendedProducts(
  profile: UserProfile,
  allProducts: Product[]
): Product[] {
  const { skinType, age, concerns, productType } = profile;
  
  console.log('🔍 getRecommendedProducts chiamata con:', { skinType, age, concerns, productType });
  console.log('📦 Totale prodotti disponibili:', allProducts.length);
  
  // Se l'utente vuole solo un tipo di prodotto specifico
  if (productType && productType !== 'routine_completa') {
    const filtered = filterByCategory(allProducts, productType);
    console.log('✅ Prodotti filtrati per categoria:', filtered.length);
    return filtered;
  }

  // 1. Filtra prodotti compatibili con il tipo di pelle
  const skinCompatibleProducts = filterBySkinType(allProducts, skinType);
  console.log('✅ Prodotti compatibili con tipo di pelle:', skinCompatibleProducts.length);
  
  // 2. Per ogni step della routine, trova il prodotto migliore
  const recommendedProducts: Product[] = [];
  
  ROUTINE_ORDER.forEach(step => {
    const stepProducts = skinCompatibleProducts.filter(p => p.step === step);
    console.log(`  Step "${step}": ${stepProducts.length} prodotti disponibili`);
    
    if (stepProducts.length === 0) return;
    
    // Calcola score per ogni prodotto in base alle problematiche
    const scoredProducts = stepProducts.map(product => ({
      product,
      score: calculateConcernMatch(product, concerns, age)
    }));
    
    // Ordina per score e prendi il migliore
    scoredProducts.sort((a, b) => b.score - a.score);
    
    console.log(`  Migliore prodotto per "${step}": ${scoredProducts[0]?.product.name} (score: ${scoredProducts[0]?.score})`);
    console.log(`  Altri prodotti disponibili:`, scoredProducts.slice(1, 3).map(sp => `${sp.product.name} (${sp.score})`));
    
    // Prendi il prodotto migliore SOLO se ha uno score decente (> 0.5)
    if (scoredProducts.length > 0 && scoredProducts[0].score > 0.5) {
      recommendedProducts.push(scoredProducts[0].product);
    } else if (scoredProducts.length > 0) {
      // Se nessun prodotto ha score alto, prendi quello con score migliore comunque
      console.log(`  ⚠️ Nessun prodotto con score alto per "${step}", prendo il migliore disponibile`);
      recommendedProducts.push(scoredProducts[0].product);
    }
  });
  
  // 3. Assicurati che ci siano almeno i prodotti base
  ensureBaseProducts(recommendedProducts, skinCompatibleProducts, skinType, age);
  
  console.log('✅ Totale prodotti raccomandati:', recommendedProducts.length);
  
  return recommendedProducts;
}

// ===== FUNZIONI DI MATCHING INTELLIGENTE =====

function filterBySkinType(products: Product[], userSkinType: string): Product[] {
  const skinLower = userSkinType.toLowerCase();
  const compatibleTypes = SKIN_TYPE_MAP[skinLower] || [userSkinType];
  
  return products.filter(product => {
    if (!product.skin_types || product.skin_types.length === 0) return true;
    
    // Controlla se il prodotto è adatto al tipo di pelle dell'utente
    return product.skin_types.some(type => 
      compatibleTypes.some(compat => 
        type.toLowerCase().includes(compat.toLowerCase()) ||
        compat.toLowerCase().includes(type.toLowerCase())
      )
    );
  });
}

function calculateConcernMatch(product: Product, userConcerns: string[], userAge: number): number {
  let score = 0;
  
  if (!product.concerns_treated || product.concerns_treated.length === 0) {
    return 0.5; // Score minimo per prodotti senza concerns specifiche
  }
  
  let matchCount = 0;
  
  // Per ogni concern dell'utente, verifica se il prodotto la risolve
  userConcerns.forEach(concern => {
    const mappedConcerns = CONCERN_MAP[concern] || [concern];
    
    // Controlla se il prodotto tratta questa problematica
    const matchesConcern = product.concerns_treated.some(treated =>
      mappedConcerns.some(mapped => {
        const treatedLower = treated.toLowerCase();
        const mappedLower = mapped.toLowerCase();
        
        // Match esatto o parziale
        return treatedLower.includes(mappedLower) || 
               mappedLower.includes(treatedLower) ||
               treatedLower === mappedLower;
      })
    );
    
    if (matchesConcern) {
      matchCount++;
      score += 15; // Peso molto alto per match diretto delle problematiche
    }
  });
  
  // Bonus maggiore se il prodotto tratta TUTTE le concern dell'utente
  if (matchCount === userConcerns.length && userConcerns.length > 1) {
    score += 20; // Bonus per copertura completa
  }
  
  // Bonus per età (prodotti anti-età per over 35)
  if (userAge > 35) {
    const hasAntiAging = product.concerns_treated.some(c => 
      c.toLowerCase().includes('rughe') ||
      c.toLowerCase().includes('elasticità') ||
      c.toLowerCase().includes('invecchiamento') ||
      c.toLowerCase().includes('anti-età') ||
      c.toLowerCase().includes('no age')
    );
    if (hasAntiAging) score += 8;
  }
  
  // Penalità se il prodotto non tratta NESSUNA concern dell'utente
  if (matchCount === 0) {
    score = 0.1;
  }
  
  return score;
}

function ensureBaseProducts(
  recommended: Product[],
  available: Product[],
  skinType: string,
  age: number
) {
  // Assicura almeno un detergente
  if (!recommended.some(p => p.step === '1. Detergente')) {
    const detergente = available.find(p => p.step === '1. Detergente');
    if (detergente) recommended.unshift(detergente);
  }
  
  // Assicura almeno una crema
  if (!recommended.some(p => p.step === '4. Crema')) {
    const crema = available.find(p => p.step === '4. Crema');
    if (crema) recommended.push(crema);
  }
}

// ===== FUNZIONI HELPER PER MESSAGGI =====

function hasRosacea(concerns: string[]): boolean {
  return concerns.includes('acne') && concerns.includes('rossori');
}

function hasAcne(concerns: string[]): boolean {
  return concerns.includes('acne') && !concerns.includes('rossori');
}

function hasSensitiveSkin(concerns: string[]): boolean {
  return concerns.includes('rossori') && !concerns.includes('acne');
}

function hasPigmentation(concerns: string[]): boolean {
  return concerns.includes('pigmentazione');
}

function hasAntiAging(concerns: string[], age: number): boolean {
  return concerns.includes('rughe') || age > 35;
}

// ===== FUNZIONI UTILITY =====


function findProduct(products: Product[], nameFragment: string): Product | undefined {
  return products.find(p => 
    p.name.toUpperCase().includes(nameFragment.toUpperCase())
  );
}

function filterByCategory(products: Product[], category: string): Product[] {
  const categoryMap: { [key: string]: string[] } = {
    'detergente': ['DETERGENTE', 'DEREGENTE'],
    'tonico': ['TONICO'],
    'siero': ['SIERO', 'ELISIR', 'ACIDO'],
    'crema': ['CREMA'],
    'maschera': ['MASCHERA'],
    'contorno_occhi': ['CONTORNO OCCHI'],
    'protezione_solare': ['SOLARE', 'SPF']
  };
  
  const keywords = categoryMap[category.toLowerCase()] || [category.toUpperCase()];
  
  return products.filter(p => 
    keywords.some(keyword => 
      p.name.toUpperCase().includes(keyword) || 
      p.step?.toUpperCase().includes(keyword)
    )
  ).slice(0, 5);
}

function sortByRoutineOrder(products: Product[]): Product[] {
  return products.sort((a, b) => {
    const aIndex = ROUTINE_ORDER.indexOf(a.step || '');
    const bIndex = ROUTINE_ORDER.indexOf(b.step || '');
    
    // Se entrambi hanno uno step definito, ordina per quello
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // Altrimenti mantieni l'ordine originale
    return 0;
  });
}

// ===== MESSAGGIO PERSONALIZZATO =====

export const getPersonalizedMessage = (profile: UserProfile): string => {
  const { skinType, age, concerns } = profile;
  
  let message = `✨ In base alla tua pelle **${skinType.toLowerCase()}**`;
  
  if (age < 25) {
    message += " e alla tua giovane età, abbiamo creato una routine che protegge e previene";
  } else if (age >= 25 && age < 35) {
    message += " e alla tua età, ti consigliamo prodotti che mantengono l'idratazione e la luminosità";
  } else if (age >= 35 && age < 45) {
    message += ", considerando che sei nella fascia d'età in cui la pelle inizia a mostrare i primi segni del tempo, abbiamo selezionato prodotti con attivi anti-età";
  } else {
    message += ", considerando la maturità della tua pelle, ti proponiamo una routine intensiva anti-aging";
  }
  
  if (concerns && concerns.length > 0) {
    message += `. I prodotti sono stati scelti **specificamente** per trattare: **${concerns.join(", ").toLowerCase()}**`;
  }
  
  message += ". 🎯 Ogni prodotto della routine è stato accuratamente selezionato per rispondere alle tue esigenze specifiche e lavorare in sinergia con gli altri.";
  
  return message;
};