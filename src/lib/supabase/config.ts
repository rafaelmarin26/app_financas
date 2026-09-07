import "server-only";

/**
 * Credenciais do Supabase.
 *
 * Estas variáveis **não** usam o prefixo `NEXT_PUBLIC_` de propósito. Todo o
 * acesso ao Supabase neste app acontece no servidor — Server Components, Server
 * Actions e o proxy —, então a chave nunca precisa chegar ao navegador. Sem o
 * prefixo, o Next não a injeta no bundle do cliente nem por acidente, e o
 * `server-only` acima transforma uma importação a partir de um Client Component
 * em erro de build, em vez de um vazamento silencioso.
 */
export const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

/**
 * O app roda sem credenciais para que a landing page e a build funcionem antes
 * do Supabase estar configurado; as telas autenticadas checam esta flag e
 * mostram instruções em vez de quebrar.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
