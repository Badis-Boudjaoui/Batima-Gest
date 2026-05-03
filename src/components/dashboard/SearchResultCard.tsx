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



export const SearchResultCard = ({ 
  item, 
  type, 
  onClick, 
  hoveredId, 
  setHoveredId 
}: { 
  key?: string | number; 
  item: any; 
  type: "user" | "building"; 
  onClick: () => void; 
  hoveredId: string | null; 
  setHoveredId: (id: string | null) => void;
}) => {
  const isUser = type === "user";
  const amIHovered = hoveredId === item.id;

  return (
    <motion.button
      onMouseEnter={() => setHoveredId(item.id)}
      onMouseLeave={() => setHoveredId(null)}
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 5 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
      }}
      className="relative w-full flex items-center justify-between px-3 py-2.5 outline-none text-left rounded-xl select-none group focus:bg-slate-100/50 dark:focus:bg-slate-800/50"
    >
      {/* Background highlight pill - using framer motion layoutId for "gliding" effect */}
      {amIHovered && (
        <motion.div 
          layoutId="search-result-hover-highlight"
          className={cn(
             "absolute inset-0 rounded-xl",
             isUser ? "bg-purple-50 dark:bg-purple-500/10" : "bg-blue-50 dark:bg-blue-500/10"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
          style={{ zIndex: 0 }}
        />
      )}

      <div className="relative z-10 flex items-center gap-3 w-full min-w-0">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shrink-0 transition-colors",
          item.avatar_url || (isUser && item.first_name) ? "bg-transparent shadow-none" : "bg-white dark:bg-slate-900 shadow-sm",
          (!item.avatar_url && !(isUser && item.first_name)) && "border border-slate-200 dark:border-white/10",
          amIHovered && (!item.avatar_url && !(isUser && item.first_name)) && (isUser ? "border-purple-200 dark:border-purple-500/30" : "border-blue-200 dark:border-blue-500/30") 
        )}>
          {isUser ? (
             <img src={item.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${item.first_name}`} className="w-full h-full object-cover" />
          ) : (
             item.avatar_url 
               ? <img src={item.avatar_url} className="w-full h-full object-cover" /> 
               : <Building className={cn(
                   "w-4 h-4 transition-colors", 
                   amIHovered ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                 )} />
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className={cn(
            "font-semibold text-[13px] truncate leading-tight transition-colors duration-200 text-slate-800 dark:text-slate-200",
            amIHovered && (isUser ? "text-purple-700 dark:text-purple-300" : "text-blue-700 dark:text-blue-300")
          )}>
             {isUser ? `${item.first_name} ${item.last_name}` : item.nom}
          </h3>
          <p className={cn(
            "text-[11px] font-medium truncate leading-tight transition-colors duration-200 text-slate-500 dark:text-slate-400",
            amIHovered && (isUser ? "text-purple-600/80 dark:text-purple-300/80" : "text-blue-600/80 dark:text-blue-300/80")
          )}>
             {isUser ? item.profession : item.adresse}
          </p>
        </div>
      </div>

      <div className={cn(
        "relative z-10 flex-shrink-0 ml-2 transition-all duration-200",
        amIHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 text-slate-400",
        isUser ? "text-purple-500" : "text-blue-500"
      )}>
        <ArrowRight size={14} strokeWidth={2.5} />
      </div>
    </motion.button>
  );
};