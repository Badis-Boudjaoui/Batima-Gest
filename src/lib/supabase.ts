import { createClient } from "@supabase/supabase-js";

// ==============================================
// --- MODIFIEZ VOS IDENTIFIANTS SUPABASE ICI ---
// ==============================================
// Remplacez les valeurs ci-dessous par votre URL et votre Clé Anon Supabase réelles
// Vous pouvez les trouver dans votre tableau de bord Supabase -> Settings -> API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://htongrspjbbyhnabucfg.supabase.co"; 
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable__RaiX6HS1Rx2rvgM9dfOJQ_-Oc2ofqE";
// ==============================================

const supabaseUrl = SUPABASE_URL.endsWith('/') ? SUPABASE_URL.slice(0, -1) : SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

const isPlaceholder = (url: string) => !url || url === "YOUR_SUPABASE_URL_HERE" || url.includes("placeholder");

export const supabase = createClient(
  isPlaceholder(supabaseUrl) ? "https://placeholder.supabase.co" : supabaseUrl, 
  isPlaceholder(supabaseAnonKey) ? "placeholder-key" : supabaseAnonKey
);

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.warn("⚠️ Identifiants Supabase non configurés dans src/lib/supabase.ts. Remplacez les placeholders par vos vraies clés.");
}
