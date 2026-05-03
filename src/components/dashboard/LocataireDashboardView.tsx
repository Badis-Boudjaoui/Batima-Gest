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

export default function LocataireDashboardView({ user, batiment, onBack, onLeaveBuilding, onViewBuilding, onViewUser }: { user: User, batiment: Batiment, onBack: () => void, onLeaveBuilding: () => Promise<void> | void, onViewBuilding: () => void, onViewUser: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<"affichage" | "signaler" | "mes-tickets" | "residents">("affichage");
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [owner, setOwner] = useState<User | null>(null);
  const [residents, setResidents] = useState<any[]>([]);
  
  // États de formulaire
  const [areaId, setAreaId] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [batiment.id]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      // 1. Fetch Ressources
      const { data: resData } = await supabase
        .from("ressources")
        .select("*")
        .eq("batiment_id", batiment.id)
        .order("name");
      
      let currentResIds: number[] = [];
      if (resData) {
        setRessources(resData);
        currentResIds = resData.map(r => r.id);
        if (resData.length > 0) setAreaId(resData[0].id.toString());
      }

      // 2. Fetch Annonces
      const { data: annData } = await supabase
        .from("annonces")
        .select(`
          id, titre, contenu, created_at,
          Utilisateurs:author_id (first_name, last_name)
        `)
        .eq("batiment_id", batiment.id)
        .order("created_at", { ascending: false });
      
      if (annData) setAnnonces(annData);

      // 4. Fetch Owner
      const { data: ownerMember } = await supabase
        .from("membres_batiments")
        .select(`Utilisateurs:user_id (*)`)
        .eq("batiment_id", batiment.id)
        .eq("role", "proprio")
        .maybeSingle();
      
      if (ownerMember?.Utilisateurs) {
        setOwner(ownerMember.Utilisateurs as any);
      }

      // 3. Fetch All Tickets for the building
      if (currentResIds.length > 0) {
        const { data: tData } = await supabase
          .from("interactions")
          .select(`
            id, issue_description, photo_url, status, created_at, admin_reply, resident_id,
            Ressources:area_id (name),
            Utilisateurs:resident_id (first_name, last_name, avatar_url)
          `)
          .in("area_id", currentResIds)
          .order("created_at", { ascending: false });
        
        if (tData) setMyTickets(tData);
      }

      // 5. Fetch co-residents
      const { data: membersData } = await supabase
        .from("membres_batiments")
        .select(`
          id, role,
          Utilisateurs:user_id (id, first_name, last_name, avatar_url, profession)
        `)
        .eq("batiment_id", batiment.id);
      
      if (membersData) {
        // Exclude current user
        setResidents(membersData.filter((m: any) => m.Utilisateurs?.id !== user.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId) {
      setError("Veuillez sélectionner une ressource.");
      return;
    }
    if (!desc) {
      setError("Veuillez décrire le problème.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let photo_url = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `pannes/${batiment.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("fichiers_batima")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("fichiers_batima")
          .getPublicUrl(filePath);
          
        photo_url = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("interactions")
        .insert({
          resident_id: user.id,
          area_id: parseInt(areaId, 10),
          issue_description: desc,
          photo_url: photo_url,
          status: "pending"
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setDesc("");
      setFile(null);
      setPreviewUrl(null);
      fetchData();
      setActiveTab("mes-tickets"); // redirige vers les tickets pour voir le résultat
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible d'envoyer le signalement.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingTickets = myTickets.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour au dashboard
      </button>

      <div className="relative mb-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden flex flex-col">
        {/* En-tête / Bannière optimized */}
        <div className="h-44 md:h-52 w-full relative group overflow-hidden">
          {batiment.banner_url ? (
            <img src={batiment.banner_url} alt="Bannière" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
          
          {/* Main Info overlaying banner */}
          <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
             <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className={cn(
                  "w-20 h-20 md:w-28 md:h-28 rounded-3xl overflow-hidden shrink-0 shadow-2xl relative z-10 border-4 border-slate-950",
                  batiment.avatar_url ? "bg-transparent" : "bg-slate-800 flex items-center justify-center"
                )}>
                  {batiment.avatar_url ? (
                    <img src={batiment.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Building className="w-10 h-10 text-slate-500" />
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                   <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                         <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter line-clamp-1">{batiment.nom}</h1>
                         <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">LOCATAIRE</span>
                         </div>
                      </div>
                      <button 
                        onClick={onViewBuilding}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        <Building className="w-3.5 h-3.5" /> Fiche Bâtiment
                      </button>
                   </div>
                   
                   <div className="flex flex-wrap gap-4 items-center">
                     {batiment.adresse && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" /> {batiment.adresse}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Espace sécurisé
                      </div>
                      {owner && (
                        <button 
                          onClick={() => onViewUser(owner.id)}
                          className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group/owner"
                        >
                          <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20">
                            {owner.avatar_url ? <img src={owner.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-0.5 text-slate-400" />}
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 group-hover/owner:text-white transition-colors">Proprio: {owner.first_name}</span>
                        </button>
                      )}
                   </div>
                </div>
                
                <div className="flex md:flex-col gap-2 relative">
                    {!showConfirmLeave ? (
                      <button 
                         disabled={isLeaving}
                         onClick={() => setShowConfirmLeave(true)}
                         className="group flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 dark:bg-white/5 dark:hover:bg-red-500/10 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/30 active:scale-95 disabled:opacity-50 shadow-sm whitespace-nowrap"
                         title="Quitter l'infrastructure"
                      >
                         <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                         <span>Quitter</span>
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl animate-in fade-in zoom-in duration-200 z-50">
                        <p className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 text-center leading-tight">Confirmer le départ ?</p>
                        <div className="flex items-center gap-1.5">
                          <button 
                            disabled={isLeaving}
                            onClick={async () => {
                              setIsLeaving(true);
                              try {
                                await onLeaveBuilding();
                              } catch (err) {
                                console.error(err);
                                alert("Erreur: Impossible de quitter.");
                              } finally {
                                setIsLeaving(false);
                                setShowConfirmLeave(false);
                              }
                            }}
                            className="flex-1 py-1.5 px-3 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {isLeaving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Oui"}
                          </button>
                          <button 
                            disabled={isLeaving}
                            onClick={() => setShowConfirmLeave(false)}
                            className="flex-1 py-1.5 px-3 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-tighter hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                          >
                            Non
                          </button>
                        </div>
                      </div>
                    )}
                 </div>
             </div>
          </div>
        </div>
        
        {/* Description section below banner */}
        {batiment.description && (
          <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl font-medium line-clamp-3 italic opacity-80">
              « {batiment.description} »
            </p>
          </div>
        )}
      </div>

      {/* Tabs updated to match owner's modern style */}
      <div className="flex justify-center mb-10">
        <div className="relative p-1.5 bg-slate-900/5 dark:bg-white/5 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 flex flex-wrap gap-1 shadow-sm overflow-hidden">
          {[
            { id: "affichage", label: "Affichage", icon: <ClipboardList className="w-4 h-4" />, badge: annonces.length },
            { id: "signaler", label: "Signaler", icon: <Wrench className="w-4 h-4" /> },
            { id: "mes-tickets", label: "Suivi pannes", icon: <MessageCircle className="w-4 h-4" />, badge: pendingTickets },
            { id: "residents", label: "Résidents", icon: <Users className="w-4 h-4" />, badge: residents.length },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "group relative flex items-center gap-2.5 px-5 py-3 rounded-[18px] text-[13px] font-bold transition-all duration-500 whitespace-nowrap",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeLocataireTabBackground"
                    className="absolute inset-0 bg-white dark:bg-white/[0.08] shadow-sm dark:shadow-none border border-slate-200/50 dark:border-white/10 rounded-[18px]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <motion.span className={cn(
                  "relative z-10 transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )}>
                  {tab.icon}
                </motion.span>
                
                <span className="relative z-10 tracking-tight flex items-center gap-2">
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                      isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>


      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "affichage" && (
            <div className="space-y-6">
              {annonces.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-white/5">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white mb-2">Aucune annonce</h3>
                  <p className="text-sm text-slate-500">Il n'y a pas d'annonce de la gestion pour le moment.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {annonces.map(annonce => (
                    <TiltCard key={annonce.id}>
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-xl transition-all relative overflow-hidden flex flex-col h-full group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2 rounded-xl">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <h4 className="font-black text-slate-900 dark:text-white text-lg flex-1 truncate tracking-tight">{annonce.titre}</h4>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1 whitespace-pre-wrap mb-6 line-clamp-4 font-medium italic">
                          {annonce.contenu}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-white/5">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden">
                                <UserIcon className="w-4 h-4 text-slate-400" />
                             </div>
                             <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                               Par {annonce.Utilisateurs?.first_name}
                             </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(annonce.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "signaler" && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-blue-600"></div>
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
                  <Wrench className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Signaler une panne</h2>
                <p className="text-slate-500 text-sm mt-2">Aidez la gestion à intervenir rapidement.</p>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl flex items-center gap-2 border border-emerald-200">
                  <ShieldCheck className="w-5 h-5 shrink-0" /> Signalement envoyé ! Redirection...
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertOctagon className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide mb-2">Que concerne ce problème ?</label>
                  {loadingData ? (
                     <div className="animate-pulse h-12 bg-slate-100 rounded-xl"></div>
                  ) : ressources.length === 0 ? (
                     <div className="text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200 font-medium">
                       La gestion n'a pas encore configuré de ressources (ascenseurs, portails...).
                     </div>
                  ) : (
                    <select 
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50 hover:bg-slate-100 transition text-sm font-medium text-slate-800"
                      value={areaId}
                      onChange={e => setAreaId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Choisir l'équipement...</option>
                      {ressources.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide mb-2">Description</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white transition"
                    placeholder="Détaillez le problème rencontré..."
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide mb-2">Preuve visuelle (Photo)</label>
                  
                  {previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 group w-fit">
                      <img src={previewUrl} className="h-40 w-auto object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setFile(null); setPreviewUrl(null); }}
                        className="absolute inset-0 bg-black/50 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition">
                      <FileImage className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm font-semibold text-slate-600">Ajouter une photo</span>
                      <span className="text-xs text-slate-400 mt-1">Optionnel - JPG, PNG...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button 
                    type="submit" 
                    disabled={submitting || ressources.length === 0 || loadingData}
                    className="w-full bg-blue-600 text-white rounded-xl px-4 py-3.5 font-bold hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2 text-sm shadow-sm"
                  >
                    {submitting ? (
                      <span className="animate-pulse">Transmission en cours...</span>
                    ) : (
                      <><ShieldCheck className="w-5 h-5" /> Envoyer le signalement</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "mes-tickets" && (
            <div className="space-y-6">
              {loadingData ? (
                 <div className="text-center text-sm text-slate-500 animate-pulse py-8">Chargement des signalements...</div>
              ) : myTickets.length === 0 ? (
                 <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-500">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle className="w-8 h-8 text-slate-300" />
                   </div>
                   <h3 className="font-extrabold text-slate-900 mb-2">Aucun signalement en cours</h3>
                   <p className="text-sm text-slate-500">La communauté n'a remonté aucune panne pour le moment.</p>
                 </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-10">
                  {myTickets.map(ticket => {
                    const isMine = ticket.resident_id === user.id;
                    return (
                      <TiltCard key={ticket.id}>
                        <div className={cn("bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col relative overflow-hidden h-full", isMine ? "border-blue-200" : "border-slate-200")}>
                          <div className={cn("absolute top-0 left-0 w-1.5 h-full", isMine ? "bg-blue-500" : "bg-slate-200")}></div>
                          
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col gap-2">
                              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 w-fit">
                                {ticket.Ressources?.name || "Ressource inconnue"}
                              </span>
                              <div className="flex items-center gap-2">
                                {ticket.Utilisateurs?.avatar_url ? (
                                  <img src={ticket.Utilisateurs.avatar_url} className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                    <UserIcon className="w-3 h-3 text-slate-400" />
                                  </div>
                                )}
                                <span className="text-[11px] font-bold text-slate-500">
                                  {isMine ? 'Moi' : ticket.Utilisateurs?.first_name}
                                </span>
                              </div>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                              ticket.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              ticket.status === 'in_progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}>
                              {ticket.status === 'pending' ? 'En attente' : ticket.status === 'in_progress' ? 'En cours' : 'Résolu'}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-3">
                            Le {new Date(ticket.created_at).toLocaleDateString('fr-FR')} à {new Date(ticket.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          
                          <p className="text-sm text-slate-700 font-medium mb-4 flex-1">
                            {ticket.issue_description}
                          </p>

                          {ticket.photo_url && (
                            <div className="mb-4">
                              <a href={ticket.photo_url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-slate-200">
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Voir l'image</span>
                                  </div>
                                <img src={ticket.photo_url} alt="Preuve" className="h-24 w-auto object-cover" />
                              </a>
                            </div>
                          )}

                          {ticket.admin_reply && (
                            <div className="mt-auto bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                              <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Réponse de la gestion
                              </div>
                              <p className="text-sm text-slate-800">{ticket.admin_reply}</p>
                            </div>
                          )}
                        </div>
                      </TiltCard>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "residents" && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                Résidents de l'infrastructure
              </h3>
              {residents.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white mb-2">Aucun autre résident</h3>
                  <p className="text-sm text-slate-500">Vous êtes le seul membre pour le moment.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {residents.map((m: any) => (
                    <TiltCard key={m.id} onClick={() => m.Utilisateurs?.id && onViewUser(m.Utilisateurs.id)}>
                      <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all cursor-pointer h-full flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white dark:border-white/10 shadow-sm">
                          {m.Utilisateurs?.avatar_url ? (
                            <img src={m.Utilisateurs.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-7 h-7 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {m.Utilisateurs?.first_name} {m.Utilisateurs?.last_name}
                          </div>
                          {m.Utilisateurs?.profession && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{m.Utilisateurs.profession}</div>
                          )}
                          <span className={cn(
                            "inline-block mt-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                            m.role === 'proprio' ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          )}>
                            {m.role === 'proprio' ? 'Propriétaire' : 'Locataire'}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors shrink-0" />
                      </div>
                    </TiltCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}