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

export default function BuildingProfileView({ buildingId, currentUserId, onBack, onMessageProprio }: { buildingId: string, currentUserId: string, onBack: () => void, onMessageProprio: (id: string) => void }) {
  const [building, setBuilding] = useState<any>(null);
  const [proprio, setProprio] = useState<any>(null);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [ressources, setRessources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<"none" | "pending" | "member">("none");
  const [joining, setJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    fetchBuildingData();
  }, [buildingId]);

  const fetchBuildingData = async () => {
    setLoading(true);
    try {
      // 1. Fetch building details
      const { data: bData } = await supabase
        .from("batiments")
        .select("*")
        .eq("id", buildingId)
        .single();
      
      if (!bData) return;
      setBuilding(bData);

      // 2. Fetch owner (proprio)
      const { data: pData } = await supabase
        .from("membres_batiments")
        .select(`
          user_id,
          Utilisateurs:user_id (id, first_name, last_name, avatar_url, profession, bio)
        `)
        .eq("batiment_id", buildingId)
        .eq("role", "proprio")
        .maybeSingle(); // maybeSingle instead of single to handle buildings with no owner yet
      
      if (pData) {
        setProprio(pData.Utilisateurs);
      }

      // 3. Fetch announcements (annonces)
      const { data: aData } = await supabase
        .from("annonces")
        .select(`
          id, titre, contenu, created_at,
          Utilisateurs:author_id (first_name, last_name, avatar_url)
        `)
        .eq("batiment_id", buildingId)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (aData) setAnnonces(aData);

      // 4. Fetch resources (ressources)
      const { data: rData } = await supabase
        .from("ressources")
        .select("*")
        .eq("batiment_id", buildingId)
        .order("name");
      
      if (rData) setRessources(rData);

      // 5. Check membership status
      const [memRes, pendRes] = await Promise.all([
        supabase.from("membres_batiments").select("id").eq("user_id", currentUserId).eq("batiment_id", buildingId).maybeSingle(),
        supabase.from("demandes_adhesion").select("id").eq("user_id", currentUserId).eq("batiment_id", buildingId).eq("status", "pending").maybeSingle()
      ]);

      if (memRes.data) setMembershipStatus("member");
      else if (pendRes.data) setMembershipStatus("pending");
      else setMembershipStatus("none");

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    setJoinError("");
    try {
      // Verify password against building's mot_de_passe
      if (building.mot_de_passe && joinPassword !== building.mot_de_passe) {
        setJoinError("Mot de passe incorrect.");
        setJoining(false);
        return;
      }

      const { error } = await supabase
        .from("demandes_adhesion")
        .insert({
          user_id: currentUserId,
          batiment_id: buildingId,
          status: "pending"
        });
      
      if (error) throw error;
      setMembershipStatus("pending");
      setShowJoinModal(false);
      setJoinPassword("");
    } catch (err) {
      console.error(err);
      setJoinError("Erreur lors de l'envoi de la demande d'adhésion.");
    } finally {
      setJoining(false);
    }
  };

  if (loading || !building) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 gap-6">
      <AnimatedLogo size={48} loop={true} />
      <div className="flex items-center gap-3">
        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold tracking-[0.2em] text-[11px] uppercase">
          Extraction des données
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
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour à la recherche
      </button>

      {/* Hero Section (Facebook style) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative mb-8">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-slate-200 relative">
          {building.banner_url ? (
            <img src={building.banner_url} alt="Bannière" className="w-full h-full object-cover" />
          ) : (
            <img 
              src="https://picsum.photos/seed/architecture/1200/400" 
              alt="Default Banner" 
              className="w-full h-full object-cover filter brightness-75"
              referrerPolicy="no-referrer"
            />
          )}
          {/* Gradient fade from top (clear) to bottom (blends with panel) */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
        </div>

        {/* Profile Info Overlay */}
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12 md:-mt-16">
              {/* Avatar */}
              <div className={cn("w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0 z-10 flex items-center justify-center", building.avatar_url ? "bg-transparent border-none shadow-none" : "bg-white border-4 border-white shadow-lg")}>
                {building.avatar_url ? (
                  <img src={building.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                    <Building className="w-12 h-12 text-blue-600" />
                  </div>
                )}
              </div>

              <div className="mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">
                  {building.nom}
                </h1>
                {building.adresse && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mb-1">
                    <MapPin className="w-4 h-4" /> {building.adresse}
                  </div>
                )}
                {membershipStatus === "member" && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-100 w-fit">
                    <CheckCircle className="w-3.5 h-3.5" /> Adhérent
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {membershipStatus === "none" && (
                <button 
                  onClick={() => setShowJoinModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-98"
                >
                  Rejoindre l'infrastructure
                </button>
              )}
              {membershipStatus === "pending" && (
                <div className="bg-amber-50 text-amber-700 px-6 py-3 rounded-xl font-bold text-sm border border-amber-200 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Demande en attente
                </div>
              )}
              {membershipStatus === "member" && (
                <div className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm border border-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Déjà membre
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          {/* About */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" /> À propos
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {building.description || <span className="italic text-slate-400">Aucune description disponible pour cette infrastructure.</span>}
            </p>
          </div>

          {/* Announcements */}
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" /> Dernières annonces
            </h3>
            {annonces.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                Aucune annonce récente.
              </div>
            ) : (
              <div className="space-y-10">
                {annonces.map(a => (
                  <TiltCard key={a.id}>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group h-full">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {a.Utilisateurs?.avatar_url ? (
                            <img src={a.Utilisateurs.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-3.5 h-3.5 text-slate-400" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900">
                            {a.Utilisateurs?.first_name} {a.Utilisateurs?.last_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">{new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-slate-900 mb-2">{a.titre}</h4>
                      <p className="text-sm text-slate-600 line-clamp-3">{a.contenu}</p>
                    </div>
                  </TiltCard>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Proprio Info */}
          {proprio && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Géré par</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                  {proprio.avatar_url ? (
                    <img src={proprio.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-6 h-6 text-slate-300" /></div>
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 leading-tight">
                    {proprio.first_name} {proprio.last_name}
                  </div>
                  {proprio.profession && (
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">{proprio.profession}</div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => onMessageProprio(proprio.id)}
                className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Contacter
              </button>
            </div>
          )}

          {/* Resources List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-500" /> Équipements
            </h3>
            {ressources.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun équipement listé.</p>
            ) : (
              <div className="space-y-3">
                {ressources.map(r => (
                  <div key={r.id} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-xs font-bold text-slate-800">{r.name}</div>
                    {r.description && <div className="text-[10px] text-slate-500 mt-1">{r.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join password modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6 mx-auto">
              <KeyRound className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Rejoindre l'infrastructure</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center text-xs mb-6">Entrez le mot de passe fourni par le propriétaire pour envoyer votre demande d'adhésion.</p>
            
            {joinError && <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl mb-4 font-bold text-center border border-red-200 dark:border-red-500/20">{joinError}</div>}

            <input 
              type="password"
              placeholder="Mot de passe du bâtiment"
              value={joinPassword}
              onChange={e => setJoinPassword(e.target.value)}
              className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm mb-5 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowJoinModal(false); setJoinPassword(""); setJoinError(""); }}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl font-bold text-sm transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleJoin}
                disabled={joining || !joinPassword}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}