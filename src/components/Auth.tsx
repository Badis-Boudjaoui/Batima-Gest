import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Lock, Mail, User, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DarkVeil from "./DarkVeil";
import AnimatedLogo from "./ui/AnimatedLogo";
import TargetCursor from "./ui/TargetCursor";
import MagneticButton from "./ui/MagneticButton";

export default function Auth({ onLogin, onBack }: { onLogin: () => void, onBack?: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onLogin();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });
        if (signUpError) throw signUpError;
        
        // Si l'utilisateur est automatiquement connecté (email confirmation désactivée)
        if (data.session) {
          onLogin();
        } else {
          setMessage("Inscription réussie ! Vous pouvez maintenant vous connecter.");
          setIsLogin(true); // Switch to login view
        }
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || "Une erreur est survenue pendant la requête.";
      if (errorMessage.includes("Email not confirmed")) {
        errorMessage = "Email non confirmé. Veuillez vérifier votre boîte de réception.";
      } else if (errorMessage.toLowerCase().includes("user already registered")) {
        errorMessage = "Ce compte existe déjà. Veuillez cliquer sur 'Se connecter'.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden font-sans">
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
      />
      <DarkVeil 
        speed={0.15} 
        noiseIntensity={0.015} 
        scanlineIntensity={0.03} 
        warpAmount={0.25}
        hueShift={280} 
      />
      <div className="fixed inset-0 bg-[#0B0F19]/50 z-[-10] pointer-events-none"></div>

      {/* Floating Orbs behind the Glass Panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] opacity-40 dark:opacity-30 pointer-events-none z-0">
        <motion.div 
          animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-fuchsia-500/40 mix-blend-screen dark:mix-blend-lighten filter blur-[80px]" 
        />
        <motion.div 
          animate={{ y: [0, 30, 0], x: [0, -20, 0], scale: [1, 1.2, 1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-10 right-0 w-80 h-80 rounded-full bg-blue-500/40 mix-blend-screen dark:mix-blend-lighten filter blur-[90px]" 
        />
        <motion.div 
          animate={{ y: [0, -20, 0], x: [0, -30, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-10 left-10 w-72 h-72 rounded-full bg-purple-600/40 mix-blend-screen dark:mix-blend-lighten filter blur-[80px]" 
        />
      </div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white/70 dark:bg-[#0c0c14]/60 backdrop-blur-3xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/60 dark:ring-white/10 z-10 mx-4 relative"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-6 left-6 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="mb-8 text-center flex flex-col items-center">
          <motion.div 
            className="mb-8 relative cursor-target"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full"></div>
            <AnimatedLogo size={56} loop={false} />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
            {isLogin ? "Connexion" : "Créer un compte"}
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {isLogin
              ? "Bienvenue sur BatimaGest, la gestion connectée"
              : "Rejoignez BatimaGest pour votre résidence."}
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 rounded-2xl bg-red-50/80 dark:bg-red-900/40 backdrop-blur-md p-4 text-sm font-semibold text-red-700 dark:text-red-300 ring-1 ring-red-200/50 dark:ring-red-500/30 shadow-sm"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-900/40 backdrop-blur-md p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200/50 dark:ring-emerald-500/30 shadow-sm"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                    Prénom
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="cursor-target block w-full rounded-2xl border border-transparent bg-white/60 dark:bg-white/5 pl-10 px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 focus:bg-white dark:focus:bg-white/10 text-slate-900 dark:text-white placeholder-slate-400/70 dark:placeholder-slate-500"
                      placeholder="Jean"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                    Nom
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="cursor-target block w-full rounded-2xl border border-transparent bg-white/60 dark:bg-white/5 pl-10 px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white dark:focus:bg-white/10 text-slate-900 dark:text-white placeholder-slate-400/70 dark:placeholder-slate-500"
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
              Adresse Email
            </label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cursor-target block w-full rounded-2xl border border-transparent bg-white/60 dark:bg-white/5 pl-10 px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white dark:focus:bg-white/10 text-slate-900 dark:text-white placeholder-slate-400/70 dark:placeholder-slate-500"
                placeholder="vous@email.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
              Mot de passe
            </label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cursor-target block w-full rounded-2xl border border-transparent bg-white/60 dark:bg-white/5 pl-10 px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-white/10 text-slate-900 dark:text-white placeholder-slate-400/70 dark:placeholder-slate-500"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <MagneticButton
            type="submit"
            disabled={loading}
            className="cursor-target mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 bg-[length:200%_auto] hover:bg-right px-4 text-sm font-bold text-white transition-all shadow-[0_8px_30px_-5px_rgba(147,51,234,0.4)] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="relative z-10">{isLogin ? "Accéder à mon espace" : "Créer mon espace"}</span>
                <ArrowRight className="h-4 w-4 ml-1 relative z-10" />
              </>
            )}
          </MagneticButton>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
            {isLogin ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}
            <span className="mx-1"></span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className="cursor-target font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
