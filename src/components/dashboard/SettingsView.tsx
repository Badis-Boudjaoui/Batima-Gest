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



export default function SettingsView({ theme, toggleTheme, onBack, user }: any) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Paramètres</h2>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6 transition-colors">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5 text-purple-500" /> Apparence
        </h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Thème OLED (Sombre)</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Activer le mode sombre pur pour les écrans OLED.</p>
          </div>
          <button 
            onClick={toggleTheme}
            className={cn("w-14 h-8 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900", theme === 'oled' ? "bg-purple-600" : "bg-slate-300")}
          >
            <motion.div 
              layout
              className={cn("w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm absolute top-1", theme === 'oled' ? "right-1" : "left-1")}
            >
              {theme === "oled" ? <Moon className="w-3 h-3 text-purple-600" /> : <Sun className="w-3 h-3 text-slate-400" />}
            </motion.div>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-500" /> Compte
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 gap-4 transition-colors">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Se déconnecter</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Fermer la session sur cet appareil.</p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}