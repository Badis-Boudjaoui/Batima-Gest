import React from 'react';
import { motion } from 'motion/react';
import { Building, Users, ShieldAlert, ArrowRight, ShieldCheck, ClipboardList, MapPin } from 'lucide-react';
import AnimatedLogo from './ui/AnimatedLogo';
import MagneticButton from './ui/MagneticButton';
import TargetCursor from './ui/TargetCursor';
import DarkVeil from './DarkVeil';

// Composant pour afficher une version simplifiée du dashboard, utilisée comme landing page
export default function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="min-h-screen text-slate-800 font-sans relative overflow-x-hidden selection:bg-purple-200 selection:text-purple-900 bg-slate-50 dark:bg-[#0c0c14]">
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
      
      <div className="fixed inset-0 bg-purple-900/5 z-[-10] pointer-events-none opacity-50"></div>

      {/* Navbar Landing Page */}
      <header className="absolute top-6 left-0 right-0 flex justify-between items-center sm:left-8 sm:right-8 z-50 px-4 sm:px-0">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 font-black text-2xl tracking-tighter"
        >
          <AnimatedLogo size={34} />
          <span className="text-slate-900 dark:text-white transition-colors drop-shadow-sm">
            Batima<span className="text-purple-600">Gest</span>
          </span>
        </motion.div>
        <motion.div
           initial={{ y: -20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.1 }}
        >
          <MagneticButton
            onClick={onLoginClick}
            className="cursor-target h-10 px-6 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-md border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm"
          >
            Se connecter
          </MagneticButton>
        </motion.div>
      </header>

      {/* Contenu principal (similaire au Dashboard Visuellement mais explicatif) */}
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-28">
        
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-6 mt-12">
            La gestion de vos bâtiments <br/>
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 text-transparent bg-clip-text">simplifiée et intelligente</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Rejoignez BatimaGest pour centraliser l'administration de vos résidences. 
            Déclarez des incidents, gérer vos locataires et communiquer en temps réel, 
            le tout dans une interface unifiée.
          </p>
          <MagneticButton
            onClick={onLoginClick}
            className="cursor-target inline-flex items-center gap-2 h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 bg-[length:200%_auto] hover:bg-right text-base font-bold text-white transition-all shadow-[0_8px_30px_-5px_rgba(147,51,234,0.4)]"
          >
            <span>Créer mon espace maintenant</span>
            <ArrowRight className="w-5 h-5" />
          </MagneticButton>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-purple-500/20">
              <Building className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Multi-Bâtiments</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Gérez plusieurs de vos résidences sur une seule plateforme ou rejoignez votre immeuble en tant que locataire avec un simple code.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-emerald-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Signalements Rapides</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Déclarez vos pannes avec photos, et permettez aux gérants de suivre la résolution de ces problèmes en temps réel.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2 lg:col-span-1 bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-xl shadow-black/5"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-orange-500/20">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Communauté</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Messagerie intégrée, annonces globales, tout est fait pour rapprocher locataires et dirigeants de résidences en toute clarté.
            </p>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
