import { createClient } from "@supabase/supabase-js";

// Utilisation des variables d'environnement (Vite)
// Assurez-vous d'avoir un fichier .env avec ces clés localement
// Et configurez-les dans les "Environment Variables" sur Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Attention : Les variables d'environnement Supabase sont manquantes !");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder-key"
);
