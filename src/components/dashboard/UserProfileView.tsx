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



export default function UserProfileView({ userId, currentUserId, onSendMessage, onViewBuilding }: { userId: string, currentUserId: string, onSendMessage: (id: string) => void, onViewBuilding: (id: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // 1. Fetch user data
      const { data: userRaw } = await supabase
        .from("utilisateurs")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (!userRaw) return;
      setProfile(userRaw);

      // 2. Fetch memberships
      const { data: memRaw } = await supabase
        .from("membres_batiments")
        .select(`
          role, 
          Batiments:batiment_id (nom)
        `)
        .eq("user_id", userId);

      if (memRaw) {
        // Filter logic: Always show if role is proprio. 
        // If role is locataire, show ONLY if userRaw.show_rented_buildings is true OR if current viewer is the same user
        const visible = memRaw.filter(m => {
          if (m.role === "proprio") return true;
          if (userId === currentUserId) return true;
          if (userRaw.show_rented_buildings !== false) return true; // defaults to true
          return false;
        });
        setBuildings(visible);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <AnimatedLogo size={48} loop={true} />
      <div className="flex items-center gap-3">
        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold tracking-[0.2em] text-[11px] uppercase">
          Acquisition du profil
        </span>
        <div className="flex gap-1">
           <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-purple-500" />
           <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
           <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover & Header */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-slate-900 w-full relative">
          {profile.banner_url && (
            <img src={profile.banner_url} alt="Bannière" className="w-full h-full object-cover opacity-80" />
          )}
          <div className={cn("absolute -bottom-12 left-8 w-24 h-24 rounded-full flex items-center justify-center overflow-hidden z-10", profile.avatar_url ? "bg-transparent border-none shadow-none" : "border-4 border-white bg-slate-100 shadow-sm")}>
             {profile.avatar_url ? (
               <img src={profile.avatar_url} className="w-full h-full object-cover" />
             ) : (
               <UserIcon className="w-10 h-10 text-slate-400" />
             )}
          </div>
        </div>
        <div className="pt-16 px-8 pb-8 relative">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">{profile.first_name} {profile.last_name}</h1>
              {profile.profession && (
                <div className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  {profile.profession}
                </div>
              )}
            </div>
            {userId !== currentUserId && (
              <button 
                onClick={() => onSendMessage(userId)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 flex items-center gap-2 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Envoyer un message
              </button>
            )}
          </div>
          
          <div className="mt-6 p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 rounded-l-2xl"></div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> À propos</h4>
            <p className="text-sm text-slate-700 max-w-3xl whitespace-pre-wrap leading-relaxed">
              {profile.bio || <span className="italic text-slate-400 font-medium">Cet utilisateur n'a pas encore rédigé de biographie.</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Buildings */}
      <div className="mt-8">
        <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" /> Infrastructures associées
        </h3>
        {buildings.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
               <Building className="w-6 h-6 text-slate-300" />
             </div>
             <p className="font-semibold">Aucune infrastructure visible pour ce profil.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((b, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={i} 
                onClick={() => b.Batiments?.id && onViewBuilding(b.Batiments.id)}
                className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-4 hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer group"
              >
                <div className={cn("absolute top-0 left-0 w-full h-[3px]", b.role === "proprio" ? "bg-amber-500" : "bg-blue-500")}></div>
                <div className={cn("p-3 rounded-xl shrink-0 mt-1 transition-colors", b.role === "proprio" ? "bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-100")}>
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-[15px] leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{b.Batiments?.nom}</div>
                  <div className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded w-fit", b.role === "proprio" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                    {b.role === "proprio" ? "Propriétaire" : "Locataire"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}