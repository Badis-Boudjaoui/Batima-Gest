"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import Auth from "../Auth";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, LayoutGroup } from "motion/react";
import DarkVeil from "../DarkVeil";
import { Magnetic } from "../ui/magnetic";
import Dock from "../Dock";
import { MaskedAvatars } from "../ui/masked-avatars";
import BorderGlow from "../ui/BorderGlow";
import ImageCropperModal from "../ui/ImageCropperModal";
import AnimatedLogo from "../ui/AnimatedLogo";
import {
  Building,
  Plus,
  KeyRound,
  Wrench,
  AlertOctagon,
  LogOut,
  AlertTriangle,
  Trash2,
  UploadCloud,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  User as UserIcon,
  Search,
  MessageCircle,
  Send,
  FileImage,
  Paperclip,
  Smile,
  CheckCircle,
  Clock,
  Loader2,
  Settings,
  Users,
  ImagePlus,
  MapPin,
  Moon,
  Sun,
  ChevronDown,
  Monitor,
  X,
  LayoutDashboard,
  UserPlus,
  ShieldAlert,
  Megaphone,
  Library,
  Sliders
} from "lucide-react";


import { User, Batiment, Membre, Ressource } from "../../types";


import TiltCard from "./TiltCard";
import TiltContainer from "./TiltContainer";

export default function BuildingsView({ membres, onCreate, onJoin, onManage, onReport, onLeaveBuilding }: any) {
  if (membres.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Bienvenue sur Batima<span className="text-blue-600">Gest</span></h1>
          <p className="text-slate-500 text-lg">Vous ne faites partie d'aucune infrastructure pour le moment.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10" style={{ perspective: "1000px" }}>
          <TiltCard 
            onClick={onCreate}
            className="group flex flex-col items-center text-center bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-colors"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Créer une Infrastructure</h3>
            <p className="text-sm text-slate-500">
              Vous êtes propriétaire ou gestionnaire ? Créez votre résidence et invitez des locataires.
            </p>
          </TiltCard>

          <TiltCard 
            onClick={onJoin}
            className="group flex flex-col items-center text-center bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-colors"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
              <KeyRound className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Rejoindre une Infrastructure</h3>
            <p className="text-sm text-slate-500">
              Vous êtes locataire ? Utilisez un code d'invitation pour rejoindre votre résidence.
            </p>
          </TiltCard>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mes Infrastructures</h1>
        <div className="flex gap-3">
          <motion.button 
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={onCreate} 
            style={{ touchAction: 'manipulation' }}
            className="flex items-center justify-center py-2.5 px-3 bg-white border border-slate-200 shadow-sm text-slate-800 rounded-xl hover:border-slate-300 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
          >
            <motion.div variants={{ rest: { rotate: 0 }, hover: { rotate: 90 } }} transition={{ duration: 0.25, ease: "easeOut" }}>
              <Plus className="w-4 h-4 text-slate-500 shrink-0" />
            </motion.div>
            <motion.div 
              variants={{
                rest: { width: 0, opacity: 0 },
                hover: { width: "auto", opacity: 1 }
              }}
              transition={{ width: { duration: 0.3, ease: [0.25, 1, 0.5, 1] }, opacity: { duration: 0.2, delay: 0.05 } }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="pl-2">Créer</div>
            </motion.div>
          </motion.button>
          
          <motion.button 
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={onJoin} 
            style={{ touchAction: 'manipulation' }}
            className="flex items-center justify-center py-2.5 px-3 bg-blue-600 shadow-sm shadow-blue-600/20 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <motion.div variants={{ rest: { rotate: 0 }, hover: { rotate: 20 } }} transition={{ duration: 0.25, ease: "easeOut" }}>
              <KeyRound className="w-4 h-4 shrink-0" />
            </motion.div>
            <motion.div 
              variants={{
                rest: { width: 0, opacity: 0 },
                hover: { width: "auto", opacity: 1 }
              }}
              transition={{ width: { duration: 0.3, ease: [0.25, 1, 0.5, 1] }, opacity: { duration: 0.2, delay: 0.05 } }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="pl-2">Rejoindre</div>
            </motion.div>
          </motion.button>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch" style={{ perspective: "1500px" }}>
        {membres.map((membre: Membre, idx: number) => (
          <TiltContainer 
            variants={itemVariants} 
            whileHover={{ y: -8, scale: 1.02 }}
            key={idx} 
            onClick={() => {
              if (membre.role === "proprio") onManage(membre.Batiments);
              else onReport(membre.Batiments);
            }}
            className="group relative flex flex-col h-full min-h-[500px] rounded-[2rem] shadow-lg transition-transform duration-500 hover:shadow-purple-500/20 cursor-pointer"
          >
            <BorderGlow 
              className="w-full h-full flex flex-col"
              borderRadius={32}
              backgroundColor="transparent"
              glowColor="270 100 60"
              edgeSensitivity={30}
              animated={true}
              fillOpacity={0}
            >
            {/* Base Background: the glass panel and banner */}
            <div className="absolute inset-0 overflow-hidden flex flex-col rounded-[2rem] glass-panel border border-slate-200/50 dark:border-white/10 pointer-events-none" style={{ transform: "translateZ(0px)" }}>
              {/* Professional Banner: Integrated & Clean */}
              <div className="relative h-44 w-full overflow-hidden shrink-0">
                {membre.Batiments?.banner_url ? (
                  <img 
                    src={membre.Batiments.banner_url} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                )}
                {/* Subtle Overlay for transition */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              </div>
            </div>

            {/* Content Layer with 3D depth */}
            <div className="flex-1 flex flex-col relative z-10 h-full" style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
              {/* Invisible spacer mimicking the banner height so content starts below it */}
              <div className="h-44 w-full shrink-0" />
              
              <div className="flex-1 flex flex-col p-8 pt-0">
                <div className="flex justify-between items-start mb-6 -mt-10" style={{ transform: "translateZ(30px)" }}>
                  <div className={cn(
                    "w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center",
                    membre.Batiments?.avatar_url ? "bg-transparent border-none shadow-none" : "bg-slate-900 border-4 border-slate-950 shadow-xl"
                  )}>
                    {membre.Batiments?.avatar_url ? (
                      <img src={membre.Batiments.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-10 h-10 text-slate-500" />
                    )}
                  </div>
                  <div className="pt-12">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      membre.role === "proprio" 
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                        : "bg-white/5 text-slate-400 border-white/10"
                    )}>
                      {membre.role === "proprio" ? "Propriétaire" : "Locataire"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4" style={{ transform: "translateZ(20px)" }}>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors tracking-tight line-clamp-1 w-fit">
                    {membre.Batiments?.nom}
                  </h3>
                  
                  {membre.Batiments?.adresse && (
                    <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {membre.Batiments.adresse}
                    </p>
                  )}
                  
                  {membre.Batiments?.description && (
                    <p className="text-sm text-slate-400/80 leading-relaxed line-clamp-3 font-medium">
                      {membre.Batiments.description}
                    </p>
                  )}

                  {/* Masked Avatars: Displaying other members */}
                  {membre.Batiments?.autres_membres && membre.Batiments.autres_membres.length > 0 && (
                    <div className="pt-2 flex flex-col" style={{ transform: "translateZ(25px)" }}>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Membres</p>
                      <MaskedAvatars 
                        avatars={membre.Batiments.autres_membres.map((m: any) => m.utilisateurs).filter(Boolean)} 
                        className="ml-0"
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Info: Invite Code & Action */}
                <div className="mt-auto flex items-end justify-between border-t border-slate-200/50 pt-5" style={{ transform: "translateZ(40px)" }}>
                  {membre.role === "proprio" ? (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Code Invite</span>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/50 group-hover:border-purple-500/30 transition-colors shadow-inner">
                        <span className="text-sm font-bold text-slate-900 font-mono tracking-widest">{membre.Batiments?.code_invitation}</span>
                      </div>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  
                  <motion.div initial="rest" whileHover="hover" className="inline-block">
                    <Magnetic strength={0.3}>
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        style={{ touchAction: 'manipulation' }}
                        onClick={(e) => { e.stopPropagation(); membre.role === "proprio" ? onManage(membre.Batiments) : onReport(membre.Batiments); }}
                        className="flex h-12 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/30 overflow-hidden cursor-pointer relative z-30"
                      >
                        <div className="flex items-center px-3.5">
                          <motion.div 
                            variants={{
                              rest: { width: 0, opacity: 0 },
                              hover: { width: "auto", opacity: 1 }
                            }}
                            transition={{ width: { duration: 0.3, ease: [0.25, 1, 0.5, 1] }, opacity: { duration: 0.2, delay: 0.05 } }}
                            className="overflow-hidden whitespace-nowrap flex items-center"
                          >
                            <span className="pr-2">{membre.role === "proprio" ? "Gérer" : "Accéder"}</span>
                          </motion.div>
                          <motion.div variants={{ rest: { x: 0 }, hover: { x: 2 } }} transition={{ duration: 0.25, ease: "easeOut" }}>
                            <ArrowRight className="w-5 h-5 shrink-0" />
                          </motion.div>
                        </div>
                      </motion.button>
                    </Magnetic>
                  </motion.div>
                </div>
              </div>
            </div>
            </BorderGlow>
          </TiltContainer>
        ))}
      </motion.div>
    </div>
  );
}