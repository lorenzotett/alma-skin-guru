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

// Mappatura tra concerns dell'utente e nomenclatura database
const CONCERN_MAP: { [key: string]: string[] } = {
  'acne': ['Acne', 'Texture uniforme', 'Pori dilatati', 'Oleosità', 'Eccesso di sebo'],
  'rughe': ['Rughe', 'Elasticità', 'Invecchiamento', 'Perdita di tono'],
  'rossori': ['Rossori', 'Pelle sensibile o irritata', 'Idratazione'],
  'pigmentazione': ['Pigmentazione', 'Macchie e discromie', 'Viso spento'],
  'occhiaie': ['Occhiaie'],
  'pori_dilatati': ['Pori dilatati', 'Texture uniforme'],
  'elasticita': ['Elasticità', 'Perdita di tono', 'Pelle poco tonica o rilassata'],
  'idratazione': ['Idratazione', 'Pelle secca', 'Secchezza cutanea']
};

// Mappatura tipo di pelle
const SKIN_TYPE_MAP: { [key: string]: string[] } = {
  'secca': ['Secca', 'Normale'],
  'grassa': ['Grassa', 'Oleosa', 'Acneica'],
  'mista': ['Mista', 'Normale'],
  'normale': ['Normale', 'Mista'],
  'asfittica': ['Asfittica', 'Acneica']
};

// Ordine preciso della beauty routine (dalle regole)
const ROUTINE_ORDER = [
  '1. DETERGENTE',
  '2. TONICO',
  '3. SIERO',
  '4. CREMA',
  '5. MASCHERA',
  '6. BURRO',
  '7. OLIO',
  '8. CONTORNO OCCHI'
];

export function getRecommendedProducts(
  profile: UserProfile,
  allProducts: Product[]
): Product[] {
  const { skinType, age, concerns, productType } = profile;
  
  // Se l'utente vuole solo un tipo di prodotto specifico
  if (productType && productType !== 'routine_completa') {
    return filterByCategory(allProducts, productType);
  }

  // 1. Filtra prodotti compatibili con il tipo di pelle
  const skinCompatibleProducts = filterBySkinType(allProducts, skinType);
  
  // 2. Per ogni step della routine, trova il prodotto migliore
  const recommendedProducts: Product[] = [];
  
  ROUTINE_ORDER.forEach(step => {
    const stepProducts = skinCompatibleProducts.filter(p => p.step === step);
    if (stepProducts.length === 0) return;
    
    // Calcola score per ogni prodotto in base alle problematiche
    const scoredProducts = stepProducts.map(product => ({
      product,
      score: calculateConcernMatch(product, concerns, age)
    }));
    
    // Ordina per score e prendi il migliore
    scoredProducts.sort((a, b) => b.score - a.score);
    
    if (scoredProducts.length > 0 && scoredProducts[0].score > 0) {
      recommendedProducts.push(scoredProducts[0].product);
    }
  });
  
  // 3. Assicurati che ci siano almeno i prodotti base
  ensureBaseProducts(recommendedProducts, skinCompatibleProducts, skinType, age);
  
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
    return 1; // Score base per prodotti senza concerns specifiche
  }
  
  // Per ogni concern dell'utente, verifica se il prodotto la risolve
  userConcerns.forEach(concern => {
    const mappedConcerns = CONCERN_MAP[concern] || [concern];
    
    // Controlla se il prodotto tratta questa problematica
    const matchesConcern = product.concerns_treated.some(treated =>
      mappedConcerns.some(mapped => 
        treated.toLowerCase().includes(mapped.toLowerCase()) ||
        mapped.toLowerCase().includes(treated.toLowerCase())
      )
    );
    
    if (matchesConcern) {
      score += 10; // Peso alto per match diretto delle problematiche
    }
  });
  
  // Bonus per età (prodotti anti-età per over 35)
  if (userAge > 35) {
    const hasAntiAging = product.concerns_treated.some(c => 
      c.toLowerCase().includes('rughe') ||
      c.toLowerCase().includes('elasticità') ||
      c.toLowerCase().includes('invecchiamento')
    );
    if (hasAntiAging) score += 5;
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
  if (!recommended.some(p => p.step === '1. DETERGENTE' || p.step === '1. DEREGENTE')) {
    const detergente = available.find(p => 
      p.step === '1. DETERGENTE' || p.step === '1. DEREGENTE'
    );
    if (detergente) recommended.unshift(detergente);
  }
  
  // Assicura almeno una crema
  if (!recommended.some(p => p.step === '4. CREMA')) {
    const crema = available.find(p => p.step === '4. CREMA');
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

export function getPersonalizedMessage(profile: UserProfile): string {
  const { skinType, concerns, age } = profile;
  
  if (hasRosacea(concerns)) {
    return "🌸 Ho identificato che la tua pelle potrebbe soffrire di rosacea (acne + rossori). Ti consiglio una routine delicata e lenitiva specifica per questa condizione sensibile.";
  }
  
  if (hasAcne(concerns)) {
    return "✨ La tua pelle ha tendenza acneica. Ti ho selezionato prodotti sebo-regolatori e purificanti che combattono le imperfezioni senza aggredire la pelle.";
  }
  
  if (hasSensitiveSkin(concerns)) {
    return "💚 La tua pelle sensibile ha bisogno di delicatezza! Ti consiglio prodotti lenitivi e calmanti per ridurre rossori e irritazioni.";
  }
  
  if (hasAntiAging(concerns, age)) {
    return "⏰ Ho selezionato per te una routine anti-età con acido ialuronico, collagene e attivi rimpolpanti per contrastare rughe e segni del tempo.";
  }
  
  if (hasPigmentation(concerns)) {
    return "☀️ Per le tue macchie e discromie, ti consiglio prodotti con azione schiarente specifica a base di acidi per uniformare il tono della pelle.";
  }
  
  return `💫 Ho selezionato i prodotti Alma Natural Beauty perfetti per la tua pelle ${skinType}, seguendo l'ordine corretto della skincare routine!`;
}