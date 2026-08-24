import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validation des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase non configuré. ' +
    'Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local'
  );
}

// ═══════════════════════════════════════════
// CLIENT SUPABASE (Browser)
// ═══════════════════════════════════════════

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Persistance de session entre les rechargements
      persistSession: true,

      // Rafraîchissement automatique du token JWT
      autoRefreshToken: true,

      // Détection de session dans l'URL (pour OAuth callbacks)
      detectSessionInUrl: true,

      // Stockage sécurisé (localStorage par défaut)
      storageKey: 'metalpedia-auth',

      // Flow type: 'pkce' recommandé pour SPA/SSR
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-metalpedia-client': 'web',
      },
    },
  }
);

// ═══════════════════════════════════════════
// CLIENT SUPABASE (Server - Admin)
// À utiliser uniquement côté serveur (Route Handlers, Server Actions)
// ⚠️ NE JAMAIS exposer la service role key côté client
// ═══════════════════════════════════════════

export function createServerClient(): SupabaseClient<Database> | null {
  if (typeof window !== 'undefined') {
    throw new Error(
      'createServerClient() ne doit être appelé que côté serveur'
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY non définie');
    return null;
  }

  return createClient<Database>(supabaseUrl!, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ═══════════════════════════════════════════
// HELPERS D'AUTHENTIFICATION
// ═══════════════════════════════════════════

/**
 * Vérifie si l'utilisateur est actuellement authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Récupère l'utilisateur courant (null si non connecté)
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Récupère la session active
 */
export async function getSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/**
 * Déconnexion complète
 */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
}

// ═══════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════

/**
 * Upload un avatar utilisateur
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Erreur upload avatar:', error);
    return null;
  }
}

// ═══════════════════════════════════════════
// SUBSCRIPTIONS REALTIME
// ═══════════════════════════════════════════

/**
 * S'abonne aux changements d'une table (à nettoyer avec unsubscribe)
 */
export function subscribeToTable(
  tableName: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ═══════════════════════════════════════════
// GESTION DES ERREURS
// ═══════════════════════════════════════════

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Formate une erreur Supabase en message lisible
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'Une erreur inconnue est survenue';

  const messages: Record<string, string> = {
    '23505': 'Cet élément existe déjà',
    '23503': 'Référence invalide',
    '42501': 'Permissions insuffisantes',
    'PGRST116': 'Aucun résultat trouvé',
    'invalid_credentials': 'Email ou mot de passe incorrect',
    'email_not_confirmed': 'Veuillez confirmer votre email',
    'user_already_exists': 'Un compte existe déjà avec cet email',
    'weak_password': 'Le mot de passe est trop faible (min. 6 caractères)',
  };

  return messages[error.code] || messages[error.message] || error.message;
}
