// Error handling utility to prevent information leakage

export function getUserFriendlyError(error: any): string {
  // PostgreSQL error codes
  if (error?.code === '23505') {
    return 'Questi dati sono già stati registrati.';
  }
  if (error?.code === '42501') {
    return 'Accesso non autorizzato.';
  }
  if (error?.code === '23503') {
    return 'Riferimento dati non valido.';
  }
  if (error?.code === '23514') {
    return 'I dati inseriti non sono validi.';
  }
  
  // Auth errors
  if (error?.message?.includes('Invalid login credentials') || error?.message?.includes('invalid_credentials')) {
    return 'Email o password non corretti. Se è la prima volta, registrati prima sulla homepage.';
  }
  
  // RLS policy violations
  if (error?.message?.includes('RLS') || error?.message?.includes('policy')) {
    return 'Operazione non consentita.';
  }
  
  // Network errors
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return 'Errore di connessione. Verifica la tua connessione internet.';
  }
  
  // Generic error
  return 'Si è verificato un errore. Riprova più tardi.';
}

export function logError(error: any, context: string) {
  // Only log in development
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, errors should be sent to a monitoring service
  // like Sentry, LogRocket, etc. instead of console
}
