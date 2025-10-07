// Product recommendation logic based on Alma Natural Beauty rules
// Follows exact rules from REGOLE - Alma Natural Beauty document

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

  // Array per prodotti raccomandati
  let recommendedProducts: Product[] = [];

  // ===== LOGICA PRINCIPALE BASATA SULLE REGOLE =====
  
  // REGOLA 1: ROSACEA (acne + rossori insieme) - PRIORITÀ MASSIMA
  if (hasRosacea(concerns)) {
    recommendedProducts = getRosaceaRoutine(allProducts, skinType);
  }
  // REGOLA 2: ACNE (senza rossori)
  else if (hasAcne(concerns)) {
    recommendedProducts = getAcneRoutine(allProducts, skinType);
  }
  // REGOLA 3: PELLE SENSIBILE (rossori senza acne)
  else if (hasSensitiveSkin(concerns)) {
    recommendedProducts = getSensitiveRoutine(allProducts, skinType);
  }
  // REGOLA 4: BASE PER TIPO DI PELLE
  else {
    recommendedProducts = getBasicRoutine(allProducts, skinType, age);
  }

  // ===== AGGIUNTE SPECIFICHE PER PROBLEMATICHE =====
  
  // MACCHIE/PIGMENTAZIONE - Aggiungi prodotti schiarenti
  if (hasPigmentation(concerns)) {
    addPigmentationProducts(recommendedProducts, allProducts);
  }

  // RUGHE/ANTI-ETÀ - Potenzia con anti-aging
  if (hasAntiAging(concerns, age)) {
    addAntiAgingProducts(recommendedProducts, allProducts);
  }

  // OCCHIAIE - Aggiungi contorno occhi
  if (hasDarkCircles(concerns)) {
    addEyeProducts(recommendedProducts, allProducts);
  }

  // PORI DILATATI - Aggiungi esfoliante
  if (hasEnlargedPores(concerns)) {
    addPoreProducts(recommendedProducts, allProducts);
  }

  // PERDITA DI ELASTICITÀ
  if (hasElasticity(concerns)) {
    addElasticityProducts(recommendedProducts, allProducts);
  }

  // Ordina i prodotti secondo la sequenza corretta della routine
  return sortByRoutineOrder(recommendedProducts);
}

// ===== FUNZIONI DI RILEVAMENTO PROBLEMATICHE =====

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

function hasDarkCircles(concerns: string[]): boolean {
  return concerns.includes('occhiaie');
}

function hasEnlargedPores(concerns: string[]): boolean {
  return concerns.includes('pori_dilatati');
}

function hasElasticity(concerns: string[]): boolean {
  return concerns.includes('elasticita');
}

// ===== ROUTINE SPECIFICHE =====

function getRosaceaRoutine(products: Product[], skinType: string): Product[] {
  // Routine per pelle con rosacea (acne + rossori)
  const routine = [];
  
  // 1. Detergente delicato
  routine.push(findProduct(products, 'BIO OLIO DETERGENTE VISO'));
  
  // 2. Tonico lenitivo
  routine.push(findProduct(products, 'TONICO SPRAY'));
  
  // 3. Siero lenitivo
  routine.push(findProduct(products, 'SIERO INTENSIVO'));
  
  // 4. Crema lenitiva
  routine.push(findProduct(products, 'CREMA VISO NOTTE FIORDALISO'));
  
  // 5. Maschera calmante
  routine.push(findProduct(products, 'MASCHERA GLOBALE'));
  
  return routine.filter(Boolean) as Product[];
}

function getAcneRoutine(products: Product[], skinType: string): Product[] {
  // Routine per pelle acneica (senza rossori)
  const routine = [];
  
  // 1. Detergente purificante
  if (skinType.toLowerCase() === 'grassa') {
    routine.push(findProduct(products, 'MOUSSE DETERGENTE VISO'));
  } else {
    routine.push(findProduct(products, 'BIO GEL DETERGENTE VISO'));
  }
  
  // 2. Tonico
  routine.push(findProduct(products, 'TONICO SPRAY'));
  
  // 3. Siero acido ialuronico
  routine.push(findProduct(products, 'ACIDO IALURONICO PURO'));
  
  // 4. Trattamento acidi
  routine.push(findProduct(products, 'FLUIDO ACIDI'));
  
  // 5. Siero correttore
  routine.push(findProduct(products, 'SIERO ACIDI'));
  
  return routine.filter(Boolean) as Product[];
}

function getSensitiveRoutine(products: Product[], skinType: string): Product[] {
  // Routine per pelle sensibile (rossori senza acne)
  const routine = [];
  
  // 1. Detergente delicato
  routine.push(findProduct(products, 'BIO OLIO DETERGENTE VISO'));
  
  // 2. Tonico lenitivo
  routine.push(findProduct(products, 'TONICO SPRAY'));
  
  // 3. Siero calmante
  routine.push(findProduct(products, 'SIERO INTENSIVO'));
  
  // 4. Crema giorno
  routine.push(findProduct(products, 'CREMA VISO GIORNO ROSA CANINA'));
  
  // 5. Crema notte
  routine.push(findProduct(products, 'CREMA VISO NOTTE FIORDALISO'));
  
  return routine.filter(Boolean) as Product[];
}

function getBasicRoutine(products: Product[], skinType: string, age: number): Product[] {
  const routine = [];
  const skinLower = skinType.toLowerCase();
  
  // PELLE SECCA
  if (skinLower === 'secca') {
    routine.push(findProduct(products, 'BIO OLIO DETERGENTE VISO'));
    routine.push(findProduct(products, 'TONICO SPRAY'));
    routine.push(findProduct(products, 'ACIDO IALURONICO PURO'));
    
    if (age > 35) {
      routine.push(findProduct(products, 'CREMA GIORNO NO-AGE'));
      routine.push(findProduct(products, 'CREMA NOTTE NO-AGE'));
    } else {
      routine.push(findProduct(products, 'CREMA VISO GIORNO ROSA CANINA'));
      routine.push(findProduct(products, 'CREMA VISO NOTTE FIORDALISO'));
    }
  }
  // PELLE GRASSA
  else if (skinLower === 'grassa') {
    routine.push(findProduct(products, 'MOUSSE DETERGENTE VISO'));
    routine.push(findProduct(products, 'TONICO SPRAY'));
    routine.push(findProduct(products, 'CREMA VISO GIORNO ROSA CANINA'));
    routine.push(findProduct(products, 'CREMA VISO NOTTE FIORDALISO'));
  }
  // PELLE MISTA
  else if (skinLower === 'mista') {
    routine.push(findProduct(products, 'BIO OLIO DETERGENTE VISO'));
    routine.push(findProduct(products, 'TONICO SPRAY'));
    routine.push(findProduct(products, 'ELISIR AL BIO MELOGRANO'));
    routine.push(findProduct(products, 'CREMA VISO GIORNO ROSA CANINA'));
  }
  // PELLE NORMALE
  else if (skinLower === 'normale') {
    routine.push(findProduct(products, 'BIO GEL DETERGENTE VISO'));
    routine.push(findProduct(products, 'TONICO SPRAY'));
    
    if (age > 35) {
      routine.push(findProduct(products, 'ACIDO IALURONICO PURO'));
      routine.push(findProduct(products, 'CREMA GIORNO NO-AGE'));
    } else {
      routine.push(findProduct(products, 'CREMA VISO GIORNO ROSA CANINA'));
    }
  }
  // PELLE ASFITTICA
  else if (skinLower === 'asfittica') {
    routine.push(findProduct(products, 'BIO GEL DETERGENTE VISO'));
    routine.push(findProduct(products, 'TONICO SPRAY'));
    routine.push(findProduct(products, 'ACIDO IALURONICO PURO'));
    routine.push(findProduct(products, 'PEELING VISO'));
  }
  
  return routine.filter(Boolean) as Product[];
}

// ===== AGGIUNTE SPECIFICHE =====

function addPigmentationProducts(routine: Product[], allProducts: Product[]) {
  const serioAcidi = findProduct(allProducts, 'SIERO ACIDI');
  const cremaAcidi = findProduct(allProducts, 'CREMA ACIDI H24');
  
  if (serioAcidi && !routine.find(p => p.name.includes('SIERO ACIDI'))) {
    routine.push(serioAcidi);
  }
  if (cremaAcidi && !routine.find(p => p.name.includes('CREMA ACIDI'))) {
    routine.push(cremaAcidi);
  }
}

function addAntiAgingProducts(routine: Product[], allProducts: Product[]) {
  const acido = findProduct(allProducts, 'ACIDO IALURONICO PURO');
  const cremaGiorno = findProduct(allProducts, 'CREMA GIORNO NO-AGE');
  const cremaNotte = findProduct(allProducts, 'CREMA NOTTE NO-AGE');
  
  if (acido && !routine.find(p => p.name.includes('ACIDO IALURONICO'))) {
    routine.push(acido);
  }
  // Ensure at least one cream is always added
  const hasCream = routine.some(p => p.category?.toLowerCase().includes('crema'));
  if (!hasCream) {
    if (cremaGiorno) routine.push(cremaGiorno);
    if (cremaNotte) routine.push(cremaNotte);
  } else {
    if (cremaGiorno && !routine.find(p => p.name.includes('GIORNO NO-AGE'))) {
      routine.push(cremaGiorno);
    }
    if (cremaNotte && !routine.find(p => p.name.includes('NOTTE NO-AGE'))) {
      routine.push(cremaNotte);
    }
  }
}

function addEyeProducts(routine: Product[], allProducts: Product[]) {
  const contorno = findProduct(allProducts, 'CONTORNO OCCHI');
  if (contorno && !routine.find(p => p.name.includes('CONTORNO OCCHI'))) {
    routine.push(contorno);
  }
}

function addPoreProducts(routine: Product[], allProducts: Product[]) {
  const esfoliante = findProduct(allProducts, 'ESFOLIANTE VISO DELICATO');
  if (esfoliante && !routine.find(p => p.name.includes('ESFOLIANTE'))) {
    routine.push(esfoliante);
  }
}

function addElasticityProducts(routine: Product[], allProducts: Product[]) {
  const elisir = findProduct(allProducts, 'ELISIR AL BIO MELOGRANO');
  if (elisir && !routine.find(p => p.name.includes('ELISIR'))) {
    routine.push(elisir);
  }
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