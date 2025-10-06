// Product recommendation logic based on Alma Natural Beauty rules

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
}

export interface UserProfile {
  skinType: string;
  age: number;
  concerns: string[];
  productType?: string;
}

export function getRecommendedProducts(
  profile: UserProfile,
  allProducts: Product[]
): Product[] {
  const { skinType, age, concerns, productType } = profile;
  
  // If user wants specific product type only
  if (productType && productType !== 'routine_completa') {
    return allProducts.filter(p => 
      p.category.toLowerCase().includes(productType.toLowerCase())
    ).slice(0, 3);
  }

  let recommendedIds: string[] = [];

  // PRIORITÀ 1: ROSACEA (acne + rossori insieme)
  if (concerns.includes('acne') && concerns.includes('rossori')) {
    recommendedIds = [
      'BIO OLIO DETERGENTE VISO',
      'TONICO SPRAY',
      'SIERO INTENSIVO',
      'CREMA VISO NOTTE FIORDALISO',
      'MASCHERA GLOBALE'
    ];
  }
  // PRIORITÀ 2: SOLO ACNE (senza rossori)
  else if (concerns.includes('acne') && !concerns.includes('rossori')) {
    recommendedIds = [
      'MOUSSE DETERGENTE VISO',
      'TONICO SPRAY',
      'ACIDO IALURONICO PURO ATTIVATORE MOLECOLARE',
      'FLUIDO ACIDI',
      'GUANTINO ESFOLIANTE ACIDO SALICILICO'
    ];
  }
  // PRIORITÀ 3: PELLE SENSIBILE (rossori senza acne)
  else if (concerns.includes('rossori') && !concerns.includes('acne')) {
    recommendedIds = [
      'BIO OLIO DETERGENTE VISO',
      'TONICO SPRAY',
      'SIERO INTENSIVO',
      'CREMA VISO GIORNO ROSA CANINA E MOSQUETA',
      'CREMA VISO NOTTE FIORDALISO'
    ];
  }
  // PRIORITÀ 5: RUGHE/ANTI-ETÀ
  else if (concerns.includes('rughe') || age > 35) {
    recommendedIds = [
      'BIO GEL DETERGENTE VISO',
      'TONICO SPRAY',
      'ACIDO IALURONICO PURO ATTIVATORE MOLECOLARE',
      'CREMA GIORNO NO-AGE',
      'CREMA NOTTE NO-AGE',
      'MASCHERA TNT IALURONICO E PEPTIDI'
    ];
  }
  // PRIORITÀ 7: ROUTINE BASE PER TIPO DI PELLE
  else {
    switch (skinType.toLowerCase()) {
      case 'secca':
        recommendedIds = [
          'BIO OLIO DETERGENTE VISO',
          'TONICO SPRAY',
          'ACIDO IALURONICO PURO ATTIVATORE MOLECOLARE',
          'CREMA GIORNO NO-AGE',
          'CREMA NOTTE NO-AGE'
        ];
        break;
      case 'grassa':
        recommendedIds = [
          'MOUSSE DETERGENTE VISO',
          'TONICO SPRAY',
          'CREMA VISO GIORNO ROSA CANINA E MOSQUETA',
          'CREMA VISO NOTTE FIORDALISO'
        ];
        break;
      case 'mista':
        recommendedIds = [
          'BIO OLIO DETERGENTE VISO',
          'TONICO SPRAY',
          'ELISIR AL BIO MELOGRANO E COLLAGENE',
          'CREMA VISO GIORNO ROSA CANINA E MOSQUETA'
        ];
        break;
      case 'normale':
        recommendedIds = [
          'BIO GEL DETERGENTE VISO',
          'TONICO SPRAY',
          'CREMA VISO GIORNO ROSA CANINA E MOSQUETA'
        ];
        break;
      case 'asfittica':
        recommendedIds = [
          'BIO GEL DETERGENTE VISO',
          'TONICO SPRAY',
          'ACIDO IALURONICO PURO ATTIVATORE MOLECOLARE',
          'PEELING VISO/CORPO PERLE DI JOJOBA'
        ];
        break;
    }
  }

  // PRIORITÀ 4: MACCHIE/PIGMENTAZIONE (aggiungi alla routine)
  if (concerns.includes('pigmentazione')) {
    if (!recommendedIds.includes('SIERO ACIDI')) {
      recommendedIds.push('SIERO ACIDI');
    }
    if (!recommendedIds.includes('CREMA ACIDI H24')) {
      recommendedIds.push('CREMA ACIDI H24');
    }
  }

  // PRIORITÀ 6: OCCHIAIE (aggiungi alla routine)
  if (concerns.includes('occhiaie')) {
    if (!recommendedIds.includes('CONTORNO OCCHI E LABBRA')) {
      recommendedIds.push('CONTORNO OCCHI E LABBRA');
    }
    if (!recommendedIds.includes('PATCH OCCHI GOLD BIOBOTOX')) {
      recommendedIds.push('PATCH OCCHI GOLD BIOBOTOX');
    }
  }

  // PRIORITÀ 8: PORI DILATATI (aggiungi alla routine)
  if (concerns.includes('pori_dilatati')) {
    if (!recommendedIds.includes('ESFOLIANTE VISO DELICATO')) {
      recommendedIds.push('ESFOLIANTE VISO DELICATO');
    }
  }

  // PRIORITÀ 9: PERDITA ELASTICITÀ (aggiungi alla routine)
  if (concerns.includes('elasticita')) {
    if (!recommendedIds.includes('ELISIR AL BIO MELOGRANO E COLLAGENE')) {
      recommendedIds.push('ELISIR AL BIO MELOGRANO E COLLAGENE');
    }
    if (!recommendedIds.includes('MASCHERA GOLD BIOBOTOX')) {
      recommendedIds.push('MASCHERA GOLD BIOBOTOX');
    }
  }

  // Match products by name
  const recommended = recommendedIds
    .map(name => allProducts.find(p => p.name.includes(name)))
    .filter(Boolean) as Product[];

  return recommended;
}

export function getPersonalizedMessage(profile: UserProfile): string {
  const { skinType, concerns, age } = profile;
  
  if (concerns.includes('acne') && concerns.includes('rossori')) {
    return "Ho identificato che la tua pelle potrebbe soffrire di rosacea. Ti consiglio prodotti delicati e lenitivi specifici per questa condizione.";
  }
  
  if (concerns.includes('acne')) {
    return "La tua pelle ha tendenza acneica. Ti consiglio prodotti sebo-regolatori che combattono le imperfezioni senza aggredire.";
  }
  
  if (concerns.includes('rughe') || age > 35) {
    return "Ho selezionato prodotti anti-età con acido ialuronico e attivi rimpolpanti per contrastare rughe e segni del tempo.";
  }
  
  if (concerns.includes('pigmentazione')) {
    return "Per le tue macchie e discromie, ti consiglio prodotti con azione schiarente specifica.";
  }
  
  return `Ho selezionato i prodotti Alma Natural Beauty perfetti per la tua pelle ${skinType}.`;
}