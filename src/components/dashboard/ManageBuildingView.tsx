"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { api } from "../../services/api";
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


// import TiltCard from "./TiltCard"; // Remplacé par motion.div pour éviter les bugs de clic 3D
import BuildingSettingsTab from "./BuildingSettingsTab";

export default function ManageBuildingView({ batiment, onBack, user, onViewUser, onViewBuilding }: { batiment: Batiment, onBack: () => void, user: User, onViewUser: (id: string) => void, onViewBuilding: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<"vue-ensemble" | "demandes" | "annonces" | "ressources" | "tickets" | "parametres">("vue-ensemble");
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]); 
  const [annonces, setAnnonces] = useState<any[]>([]); 
  const [demandes, setDemandes] = useState<any[]>([]); // Demandes d'adhésion
  const [locataires, setLocataires] = useState<any[]>([]); // Liste des locataires
  const [loading, setLoading] = useState(true);
  const [processingDemandeId, setProcessingDemandeId] = useState<number | null>(null);
  const [processingTicketId, setProcessingTicketId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resToDelete, setResToDelete] = useState<any>(null);
  const [annToDelete, setAnnToDelete] = useState<any>(null);
  
  // Formulaire Ressource
  const [nom, setNom] = useState("");
  const [desc, setDesc] = useState("");
  const [editingRessourceId, setEditingRessourceId] = useState<number | null>(null);

  // Formulaire Annonce
  const [titreAnnonce, setTitreAnnonce] = useState("");
  const [contenuAnnonce, setContenuAnnonce] = useState("");

  // Etat des réponses aux tickets
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  // Filtre des signalements
  const [filterRessource, setFilterRessource] = useState<string>("all");

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRessources(),
          fetchInteractions(),
          fetchAnnonces(),
          fetchDemandes(),
          fetchLocataires(),
        ]);
      } catch (err) {
        console.error("Initial fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [batiment.id]);

  const fetchLocataires = async () => {
    try {
      const { data, error } = await supabase
        .from("membres_batiments")
        .select(`
          id, 
          role,
          Utilisateurs:user_id (id, first_name, last_name, avatar_url, profession)
        `)
        .eq("batiment_id", batiment.id);
      
      if (error) throw error;
      if (data) setLocataires(data);
    } catch (err) {
      console.error("fetchLocataires error:", err);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'proprio' | 'locataire') => {
    setLoading(true);
    try {
      await api.updateMemberRole(userId, batiment.id, newRole);
      await fetchLocataires();
    } catch (err: any) {
      console.error("Role change error:", err);
      alert(err.message || "Erreur lors du changement de rôle.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetTicketStatus = async (ticketId: number, status: 'pending' | 'in_progress' | 'resolved') => {
    setProcessingTicketId(ticketId);
    try {
      await api.updateInteractionStatus(ticketId, status);
      await fetchInteractions();
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement de statut.");
    } finally {
      setProcessingTicketId(null);
    }
  };

  const handleDeleteBuilding = async () => {
    setLoading(true);
    setShowDeleteConfirm(false);
    try {


      // 1. On récupère les IDs des ressources pour nettoyer les tickets (interactions)
      const { data: resData, error: resFetchError } = await supabase
        .from("ressources")
        .select("id")
        .eq("batiment_id", batiment.id);
      
      if (resFetchError) throw new Error(`Erreur lors de la lecture des ressources: ${resFetchError.message}`);
      
      if (resData && resData.length > 0) {

        const { error: intError } = await supabase
          .from("interactions")
          .delete()
          .in("area_id", resData.map(r => r.id));
        if (intError) throw new Error(`Erreur lors de la suppression des tickets: ${intError.message}`);
      }
      
      // 2. Suppressions des dépendances directes

      await supabase.from("ressources").delete().eq("batiment_id", batiment.id);
      

      await supabase.from("annonces").delete().eq("batiment_id", batiment.id);


      await supabase.from("demandes_adhesion").delete().eq("batiment_id", batiment.id);
      
      // 3. Supprimer les membres (sauf soi-même pour garder les droits RLS)

      await supabase
        .from("membres_batiments")
        .delete()
        .eq("batiment_id", batiment.id)
        .neq("user_id", user.id);
      
      // 4. Supprimer le bâtiment lui-même

      const { data: delData, error: delError } = await supabase
        .from("batiments")
        .delete()
        .eq("id", batiment.id)
        .select();
      
      if (delError) {
        if (delError.message?.includes("foreign key")) {
          throw new Error("Impossible de supprimer le bâtiment : il reste des données liées. Vérifiez les contraintes FK sur Supabase.");
        }
        throw delError;
      }

      if (!delData || delData.length === 0) {
        // Tentative de supprimer soi-même en premier si RLS le permet différemment

        await supabase.from("membres_batiments").delete().eq("batiment_id", batiment.id).eq("user_id", user.id);
        const retry = await supabase.from("batiments").delete().eq("id", batiment.id).select();
        if (!retry.data || retry.data.length === 0) {
          throw new Error("Échec de la suppression. Il se peut que vous n'ayez pas configuré la politique de suppression (DELETE) pour les propriétaires sur Supabase.");
        }
      }

      // 5. Nettoyage final au cas où
      await supabase.from("membres_batiments").delete().eq("batiment_id", batiment.id).eq("user_id", user.id);
      
      alert("✅ Bâtiment supprimé avec succès.");
      onBack(); 
      window.location.reload(); 
    } catch (err: any) {
      console.error("Erreur critique lors de la suppression:", err);
      alert(`❌ Échec : ${err.message || "Erreur inconnue"}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemandes = async () => {
    try {
      const { data, error } = await supabase
        .from("demandes_adhesion")
        .select(`
          id, 
          user_id, 
          status, 
          created_at, 
          Utilisateurs:user_id (first_name, last_name, avatar_url, profession)
        `)
        .eq("batiment_id", batiment.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (data) setDemandes(data);
    } catch (err) {
      console.error("fetchDemandes error:", err);
    }
  };

  const handleAcceptDemande = async (demandeId: number, userId: string) => {
    setProcessingDemandeId(demandeId);
    try {

      
      // 1. Inserer le membre
      const { error: insErr } = await supabase.from("membres_batiments").insert({
        user_id: userId,
        batiment_id: batiment.id,
        role: "locataire"
      });
      
      if (insErr && insErr.code !== '23505') {
        throw new Error("Erreur lors de l'ajout du membre : " + insErr.message);
      }

      // 2. Mettre à jour la demande
      const { data: updData, error: updErr } = await supabase
        .from("demandes_adhesion")
        .update({ status: "accepted" })
        .eq("id", demandeId)
        .select();
      
      if (updErr) throw updErr;
      
      if (!updData || updData.length === 0) {
        throw new Error("Mise à jour refusée. Vérifiez vos politiques RLS (UPDATE) sur la table 'demandes_adhesion' sur Supabase.");
      }


      await Promise.all([fetchDemandes(), fetchLocataires()]);
    } catch (err: any) {
      console.error("Accept error:", err);
      alert(err.message || "Erreur lors de l'acceptation.");
    } finally {
      setProcessingDemandeId(null);
    }
  };

  const handleRejectDemande = async (demandeId: number) => {
    setProcessingDemandeId(demandeId);
    try {
      const { data, error } = await supabase
        .from("demandes_adhesion")
        .update({ status: "rejected" })
        .eq("id", demandeId)
        .select();
        
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Mise à jour refusée. Vérifiez vos politiques RLS (UPDATE) sur la table 'demandes_adhesion'.");
      }
      
      await fetchDemandes();
    } catch (err: any) {
      console.error("Reject error:", err);
      alert(err.message || "Erreur lors du refus.");
    } finally {
      setProcessingDemandeId(null);
    }
  };

  const fetchAnnonces = async () => {
    try {
      const { data, error } = await supabase
        .from("annonces")
        .select(`
          id, titre, contenu, created_at,
          Utilisateurs:author_id (first_name, last_name, avatar_url)
        `)
        .eq("batiment_id", batiment.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (data) setAnnonces(data);
    } catch (err) {
      console.error("fetchAnnonces error:", err);
    }
  };

  const fetchRessources = async () => {
    try {
      const { data, error } = await supabase
        .from("ressources")
        .select("*")
        .eq("batiment_id", batiment.id)
        .order("name");
      
      if (error) throw error;
      if (data) setRessources(data);
    } catch (err) {
      console.error("fetchRessources error:", err);
    }
  };

  const fetchInteractions = async () => {
    try {
      // 1. Récupérer toutes les ressources du bâtiment pour filtrer les tickets
      const { data: resData, error: resError } = await supabase
        .from("ressources")
        .select("id")
        .eq("batiment_id", batiment.id);
      
      if (resError) throw resError;
      if (!resData || resData.length === 0) {
        setInteractions([]);
        return;
      }
      const resourceIds = resData.map(r => r.id);

      // 2. Récupérer les tickets avec une relation JOIN sur Ressorces et Utilisateurs
      const { data: intData, error: intError } = await supabase
        .from("interactions")
        .select(`
          id,
          issue_description,
          photo_url,
          status,
          created_at,
          admin_reply,
          Utilisateurs:resident_id (first_name, last_name),
          Ressources:area_id (id, name)
        `)
        .in("area_id", resourceIds)
        .order("created_at", { ascending: false });

      if (intError) throw intError;
      if (intData) setInteractions(intData);
    } catch (err) {
      console.error("fetchInteractions error:", err);
    }
  };

  const handleAddRessource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom) return;

    setLoading(true);
    try {
      if (editingRessourceId) {
        // Mode Edition
        const { data, error } = await supabase
          .from("ressources")
          .update({
            name: nom,
            description: desc
          })
          .eq("id", editingRessourceId)
          .select();

        if (error) throw new Error(error.message || "Erreur de modification");
        if (!data || data.length === 0) throw new Error("Modification refusée par RLS pour ressources (UPDATE Policy requise)");
        
      } else {
        // Mode Ajout
        const { data, error } = await supabase
          .from("ressources")
          .insert({
            batiment_id: batiment.id,
            name: nom,
            description: desc
          })
          .select();

        if (error) throw new Error(error.message || "Erreur d'ajout");
        if (!data || data.length === 0) throw new Error("Ajout refusé par RLS pour ressources (INSERT Policy requise)");
      }

      setNom("");
      setDesc("");
      setEditingRessourceId(null);
      await fetchRessources(); // Update list
    } catch (err: any) {
      console.error(err);
      alert(err.message || (editingRessourceId ? "Erreur lors de la modification." : "Erreur lors de l'ajout."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRessource = async () => {
    if (!resToDelete) return;
    
    setLoading(true);
    try {

      // 1. On nettoie les tickets (interactions)
      await supabase.from("interactions").delete().eq("area_id", resToDelete);
      
      // 2. On supprime la ressource
      const { data, error } = await supabase
        .from("ressources")
        .delete()
        .eq("id", resToDelete)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Permission refusée ou ressource déjà supprimée.");
      
      setResToDelete(null);
      await fetchRessources();
    } catch (err: any) {
      console.error(err);
      alert("Erreur suppression ressource: " + (err.message || "Inconnu"));
    } finally {
      setLoading(false);
    }
  };

  const startEditRessource = (res: Ressource) => {
    setNom(res.name);
    setDesc(res.description || "");
    setEditingRessourceId(res.id as any);
    document.getElementById("form-ressource")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelEditRessource = () => {
    setNom("");
    setDesc("");
    setEditingRessourceId(null);
  };

  const handleDeleteAnnonce = async () => {
    if (!annToDelete) return;

    setLoading(true);
    try {

      const { data, error } = await supabase
        .from("annonces")
        .delete()
        .eq("id", annToDelete)
        .select();
        
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Permission refusée ou annonce déjà supprimée.");
      
      setAnnToDelete(null);
      await fetchAnnonces();
    } catch (err: any) {
      console.error(err);
      alert("Erreur suppression annonce: " + (err.message || "Inconnu"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnonce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titreAnnonce || !contenuAnnonce) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("annonces")
        .insert({
          batiment_id: batiment.id,
          author_id: user.id,
          titre: titreAnnonce,
          contenu: contenuAnnonce
        })
        .select();

      if (error) throw new Error(error.message || "Erreur lors de l'ajout de l'annonce");
      if (!data || data.length === 0) throw new Error("Ajout refusé par RLS pour annonces (INSERT Policy requise)");
      
      setTitreAnnonce("");
      setContenuAnnonce("");
      await fetchAnnonces();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur lors de l'ajout de l'annonce.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplyTicket = async (ticketId: number) => {
    const replyText = replyTexts[ticketId];
    if (!replyText) return;

    setProcessingTicketId(ticketId);
    try {
      const { error } = await supabase
        .from("interactions")
        .update({ 
          admin_reply: replyText,
          status: "resolved" 
        })
        .eq("id", ticketId);

      if (error) throw error;
      
      setReplyTexts(prev => ({ ...prev, [ticketId]: "" }));
      await fetchInteractions();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réponse au ticket.");
    } finally {
      setProcessingTicketId(null);
    }
  };

  const [confirmExclude, setConfirmExclude] = useState<{membreId: number, userId: string} | null>(null);

  const handleRemoveLocataire = async (membreId: number, userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmExclude({ membreId, userId });
  };

  const confirmRemoveLocataire = async () => {
    if (!confirmExclude) return;
    
    setLoading(true);
    try {
      await api.removeMember(confirmExclude.userId, batiment.id);
      await fetchLocataires();
    } catch (err: any) {
      console.error("Erreur exclusion:", err);
      try {
        const { data, error } = await supabase
          .from("membres_batiments")
          .delete()
          .eq("id", confirmExclude.membreId)
          .eq("batiment_id", batiment.id)
          .select();
          
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Action refusée par Supabase (RLS). Vous n'avez pas les droits pour supprimer ce membre.");
        await fetchLocataires();
      } catch (e: any) {
        alert("Erreur: " + (e.message || "Impossible d'exclure ce locataire."));
      }
    } finally {
      setLoading(false);
      setConfirmExclude(null);
    }
  };

  const pendingTickets = interactions.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const allLocataires = locataires.filter((l: any) => l.role === 'locataire');
  const otherProprios = locataires.filter((l: any) => l.role === 'proprio' && l.Utilisateurs?.id !== user.id);

  return (
    <div className="max-w-5xl mx-auto">
      
      {/* Modal Confirmation Exclusion */}
      <AnimatePresence>
        {confirmExclude && (
          <motion.div 
            key="exclude-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setConfirmExclude(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-xl border border-slate-200 dark:border-white/10 z-10"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Exclure ce locataire ?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Cette action va révoquer son accès au bâtiment. Il ne pourra plus voir les signalements ni les ressources. Vous pourrez le réinviter plus tard.
              </p>
              
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setConfirmExclude(null)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmRemoveLocataire}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Oui, l'exclure"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Retour au dashboard
      </button>

      <div className="relative mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* En-tête / Bannière */}
        {batiment.banner_url ? (
          <div className="h-32 md:h-40 w-full relative">
            <img src={batiment.banner_url} alt="Bannière" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        ) : (
          <div className="h-24 md:h-28 w-full bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        )}
        
        {/* Contenu de la carte (Photo de profil + Infos) */}
        <div className="px-6 pb-6 relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            {/* Avatar */}
            <div className={cn("w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 -mt-10 md:-mt-12 relative z-10", batiment.avatar_url ? "bg-transparent border-none shadow-none" : "bg-white border-4 border-white shadow-md")}>
              {batiment.avatar_url ? (
                <img src={batiment.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Building className="w-10 h-10 text-blue-600" />
                </div>
              )}
            </div>
            
            {/* Informations textuelles */}
            <div className="mt-2 md:mt-0">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">{batiment.nom}</h1>
              {batiment.adresse && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mb-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> {batiment.adresse}
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {batiment.description && (
                  <p className="text-sm text-slate-600 max-w-md line-clamp-1">{batiment.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono font-bold text-slate-900">{batiment.code_invitation}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Boutons d'action (Droite) */}
          <div className="flex items-center gap-3 md:mt-4">
            <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Propriétaire
            </span>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex justify-center mb-12">
        <div className="relative p-1.5 bg-slate-900/5 dark:bg-white/5 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 flex flex-wrap gap-1 shadow-sm overflow-hidden">
          {[
            { id: "vue-ensemble", label: "Vue d'ensemble", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "demandes", label: "Demandes", icon: <UserPlus className="w-4 h-4" />, badge: demandes.length },
            { id: "tickets", label: "Signalements", icon: <ShieldAlert className="w-4 h-4" />, badge: pendingTickets },
            { id: "annonces", label: "Annonces", icon: <Megaphone className="w-4 h-4" /> },
            { id: "ressources", label: "Ressources", icon: <Library className="w-4 h-4" /> },
            { id: "parametres", label: "Paramètres", icon: <Sliders className="w-4 h-4" /> },
          ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "group relative flex items-center gap-2.5 px-5 py-3 rounded-[18px] text-[13px] font-bold transition-all duration-500 whitespace-nowrap",
                isActive 
                  ? "text-purple-600 dark:text-purple-400" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-white dark:bg-white/[0.08] shadow-sm dark:shadow-none border border-slate-200/50 dark:border-white/10 rounded-[18px]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <span className={cn(
                "relative z-10 transition-transform duration-300",
                isActive ? "scale-110" : "group-hover:scale-110"
              )}>
                {tab.icon}
              </span>
              
              <span className="relative z-10 tracking-tight">
                {tab.label}
              </span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  "relative z-10 ml-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[9px] font-black shadow-sm",
                  tab.id === 'demandes' ? "bg-amber-500 text-white" : "bg-purple-600 text-white"
                )}>
                  {tab.badge}
                </span>
              )}
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
          {activeTab === "vue-ensemble" && (
            <div className="space-y-8">
              {/* Stats overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-1">
                {[
                  { value: allLocataires.length, label: "Locataire", plural: "s", color: "blue", icon: <Users className="w-5 h-5" /> },
                  { value: demandes.length, label: "En attente", color: "amber", icon: <UserPlus className="w-5 h-5" /> },
                  { value: annonces.length, label: "Annonce", plural: "s", color: "emerald", icon: <Megaphone className="w-5 h-5" /> },
                  { value: pendingTickets, label: "Panne", plural: "s", suffix: " (à traiter)", color: "rose", icon: <ShieldAlert className="w-5 h-5" /> }
                ].map((stat, i) => (
                  <div key={i} className="h-full">
                    <TiltCard>
                      <div className="group relative bg-white dark:bg-zinc-900/40 p-6 rounded-[28px] border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col items-center text-center overflow-hidden h-full">
                        <div className={cn(
                          "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
                          stat.color === 'blue' ? "bg-blue-500" : 
                          stat.color === 'amber' ? "bg-amber-500" : 
                          stat.color === 'emerald' ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                        
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110",
                          stat.color === 'blue' ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : 
                          stat.color === 'amber' ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" : 
                          stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : 
                          "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        )}>
                          {stat.icon}
                        </div>

                        <span className={cn(
                          "text-4xl font-black tracking-tight",
                          stat.color === 'blue' ? "text-blue-600 dark:text-blue-400" : 
                          stat.color === 'amber' ? "text-amber-600 dark:text-amber-400" : 
                          stat.color === 'emerald' ? "text-emerald-600 dark:text-emerald-400" : 
                          "text-rose-600 dark:text-rose-400"
                        )}>{stat.value}</span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">
                          {stat.label}{stat.plural && stat.value !== 1 ? stat.plural : ''} {stat.suffix || ''}
                        </span>
                      </div>
                    </TiltCard>
                  </div>
                ))}
              </div>

              {/* Locataires */}
              <div className="bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    Membres du bâtiment
                  </h3>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                    {locataires.length} au total
                  </div>
                </div>

                {/* Other Proprios (co-managers) */}
                {otherProprios.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-1">Co-propriétaires</h4>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {otherProprios.map((l: any) => (
                        <div key={l.id} className="h-full">
                          <div className="group relative flex items-center gap-4 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 h-full">
                            <div 
                              className="flex items-center gap-4 cursor-pointer flex-1"
                              onClick={(e) => { e.stopPropagation(); if (l.Utilisateurs?.id) onViewUser(l.Utilisateurs.id); }}
                            >
                              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-amber-200 dark:border-amber-500/20 shadow-sm">
                                {l.Utilisateurs?.avatar_url ? (
                                  <img src={l.Utilisateurs.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon className="w-6 h-6 text-amber-500" />
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-bold text-slate-900 dark:text-white text-[13px] truncate">
                                  {l.Utilisateurs?.first_name} {l.Utilisateurs?.last_name}
                                </div>
                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Propriétaire</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locataires */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-1">Locataires ({allLocataires.length})</h4>
                  {allLocataires.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 dark:bg-white/[0.01] rounded-[24px] border border-dashed border-slate-200 dark:border-white/10">
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun locataire dans ce bâtiment.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {allLocataires.map((l: any) => (
                        <div key={l.id} className="h-full">
                          <div className="group relative flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.03] hover:shadow-xl hover:shadow-black/5 hover:border-blue-500/20 transition-all duration-300 h-full">
                            
                            <div 
                              className="flex items-center gap-4 cursor-pointer flex-1"
                              onClick={(e) => { e.stopPropagation(); if (l.Utilisateurs?.id) onViewUser(l.Utilisateurs.id); }}
                            >
                              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white dark:border-white/10 shadow-sm ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all">
                                {l.Utilisateurs?.avatar_url ? (
                                  <img src={l.Utilisateurs.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-bold text-slate-900 dark:text-white text-[13px] truncate">
                                  {l.Utilisateurs?.first_name} {l.Utilisateurs?.last_name}
                                </div>
                                {l.Utilisateurs?.profession && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{l.Utilisateurs.profession}</div>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 pl-2">
                              <button 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  handleRemoveLocataire(l.id, l.Utilisateurs?.id || l.user_id, e); 
                                }}
                                className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 cursor-pointer shadow-sm border border-rose-100 dark:border-rose-500/20 transition-all active:scale-95"
                                title="Exclure ce locataire"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "demandes" && (
            <div className="space-y-8 pb-20">
              <div className="relative bg-zinc-950 dark:bg-black p-1 rounded-[40px] shadow-2xl border border-white/5 overflow-hidden">
                {/* Effet de glow d'arrière-plan */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-emerald-500/10 opacity-50" />
                
                <div className="relative p-8 md:p-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Users className="w-7 h-7 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-3xl tracking-tight">Demandes d'adhésion</h3>
                        <p className="text-zinc-500 text-sm font-medium mt-1">Gérez les futurs membres de votre infrastructure</p>
                      </div>
                    </div>
                    {demandes.length > 0 && (
                      <span className="self-start md:self-center px-6 py-2.5 bg-amber-50 rounded-full text-amber-700 text-xs font-black uppercase tracking-widest border border-amber-200/50 shadow-lg shadow-amber-500/10">
                        {demandes.length} en attente
                      </span>
                    )}
                  </div>
                  
                  {demandes.length === 0 ? (
                    <div className="text-center py-24 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                        <CheckCircle className="w-10 h-10 text-emerald-500/40" />
                      </div>
                      <p className="text-zinc-400 text-lg font-bold">Aucune demande d'adhésion en ce moment.</p>
                      <p className="text-zinc-600 text-sm mt-2">Tout est à jour !</p>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-2 gap-8">
                      {demandes.map(d => {
                        const isProcessing = processingDemandeId === d.id;
                        return (
                          <motion.div 
                            key={d.id}
                            whileHover={{ y: -5 }}
                            className="group relative h-full bg-zinc-900/40 backdrop-blur-md p-8 rounded-[35px] border border-white/5 hover:border-amber-500/30 transition-all duration-500 flex flex-col gap-8 overflow-hidden"
                          >
                              {/* Background highlights */}
                              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors" />
                              
                              <div className="flex items-center gap-6 relative z-10">
                                <div className="w-20 h-20 rounded-[28px] bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                  {d.Utilisateurs?.avatar_url ? (
                                    <img src={d.Utilisateurs.avatar_url} className="w-full h-full object-cover" />
                                  ) : (
                                    <UserIcon className="w-9 h-9 text-zinc-600" />
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <h4 className="font-black text-white text-2xl truncate tracking-tight uppercase">
                                    {d.Utilisateurs?.first_name} {d.Utilisateurs?.last_name}
                                  </h4>
                                  {d.Utilisateurs?.profession && (
                                    <div className="inline-block mt-2 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-amber-500/20">
                                      {d.Utilisateurs.profession}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-auto grid grid-cols-2 gap-5 relative z-10">
                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAcceptDemande(d.id, d.user_id); }} 
                                  disabled={isProcessing}
                                  className="relative group/btn flex items-center justify-center gap-3 bg-emerald-500 text-white h-16 rounded-[22px] font-black text-sm uppercase tracking-widest transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 disabled:opacity-50 overflow-hidden"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-5 h-5" />
                                      <span>Accepter</span>
                                    </>
                                  )}
                                  {/* Glass highlight effect on button */}
                                  <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                </button>

                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRejectDemande(d.id); }} 
                                  disabled={isProcessing}
                                  className="flex items-center justify-center bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 h-16 rounded-[22px] font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 border border-white/5"
                                >
                                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Refuser"}
                                </button>
                              </div>

                              {/* Decoration line */}
                              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "annonces" && (
            <div className="grid md:grid-cols-[1fr_350px] gap-8">
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-lg mb-4">Annonces publiées</h3>
                {annonces.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-white/[0.02] rounded-[32px] border border-dashed border-slate-200 dark:border-white/10">
                    <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Aucune annonce publiée pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {annonces.map(annonce => (
                      <motion.div 
                        key={annonce.id}
                        whileHover={{ y: -5 }}
                        className="group bg-white dark:bg-white/[0.03] rounded-[24px] p-6 border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:border-emerald-500/20 transition-all relative overflow-hidden h-full"
                      >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
                          <h4 className="font-black text-slate-900 dark:text-white text-lg mb-2">{annonce.titre}</h4>
                          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed mb-5">{annonce.contenu}</p>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl w-fit">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            Publié le {new Date(annonce.created_at).toLocaleDateString('fr-FR')} par {annonce.Utilisateurs?.first_name}
                          </div>
                          
                          <div className="absolute top-4 right-4 flex gap-2 z-20">
                            <button 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 

                                setAnnToDelete(annonce.id); 
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 shadow-lg shadow-red-600/20 transition-all active:scale-95 cursor-pointer"
                              title="Supprimer l'annonce"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Supprimer</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 rounded-[32px] p-8 sticky top-24 shadow-sm backdrop-blur-xl">
                  <h3 className="font-black text-slate-900 dark:text-white text-xl mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-blue-500" />
                    </div>
                    Nouvelle annonce
                  </h3>
                  <form onSubmit={handleAddAnnonce} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Titre de l'annonce</label>
                      <input 
                        required
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-400"
                        placeholder="Ex: Coupure d'eau"
                        value={titreAnnonce}
                        onChange={e => setTitreAnnonce(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Message</label>
                      <textarea 
                        required
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none resize-none transition-all placeholder:text-slate-400"
                        rows={5}
                        placeholder="Ex: Ce mardi de 14h à 16h..."
                        value={contenuAnnonce}
                        onChange={e => setContenuAnnonce(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="group relative w-full bg-blue-600 h-12 text-white rounded-2xl font-black text-[13px] hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      {loading ? "Chargement..." : "Publier l'annonce"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ressources" && (
            <div className="grid md:grid-cols-[1fr_350px] gap-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-lg mb-6">Liste des ressources</h3>
                {loading ? (
                   <div className="text-sm text-slate-500 animate-pulse">Chargement...</div>
                ) : ressources.length === 0 ? (
                   <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                     <Settings className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                     <p className="text-sm text-slate-500">Aucune ressource configurée.</p>
                   </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {ressources.map((r) => (
                      <div key={r.id} className={cn(
                        "p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all bg-white relative overflow-hidden group"
                      )}>
                        <div className="absolute top-2 right-2 flex gap-1.5 z-20">
                          <button 
                            disabled={loading}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditRessource(r); }}
                            className="p-1.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white rounded-lg flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            title="Modifier"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            disabled={loading}
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 

                              setResToDelete(r.id); 
                            }}
                            className="p-1.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Toujours visible sur mobile/tablette si besoin, mais ici on garde le hover pour le style épuré */}
                        <div className="font-extrabold text-slate-900 mb-1 pr-16 relative z-0">{r.name}</div>
                        {r.description ? (
                          <div className="text-xs text-slate-500">{r.description}</div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">Aucune description</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <div id="form-ressource" className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24 shadow-sm">
                  <h3 className="font-extrabold text-slate-900 mb-4">{editingRessourceId ? "Modifier la ressource" : "Ajouter une ressource"}</h3>
                  <form onSubmit={handleAddRessource} className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">Nom</label>
                      <input 
                        required
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        placeholder="Ex: Ascenseur Bât E"
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">Description</label>
                      <textarea 
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
                        rows={3}
                        placeholder="Equipements, remarques..."
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                       <button 
                         type="submit" 
                         disabled={loading}
                         className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2.5 font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
                       >
                         {loading ? "Patientez..." : (editingRessourceId ? "Mettre à jour" : "Ajouter la ressource")}
                       </button>
                       {editingRessourceId && (
                         <button 
                           type="button"
                           onClick={cancelEditRessource}
                           className="px-4 bg-slate-100 text-slate-600 rounded-lg py-2.5 text-sm font-bold hover:bg-slate-200 transition"
                         >
                           Annuler
                         </button>
                       )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tickets" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="font-extrabold text-slate-900 text-lg">Signalements et pannes</h3>
                
                {/* Filtre par ressource */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Filtrer :</label>
                  <select 
                    className="bg-white border border-slate-200 text-sm font-medium text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition shadow-sm cursor-pointer"
                    value={filterRessource}
                    onChange={(e) => setFilterRessource(e.target.value)}
                  >
                    <option value="all">Toutes les ressources</option>
                    {ressources.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-sm text-slate-500 animate-pulse">Chargement des signalements...</div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 mb-2">Tout fonctionne parfaitement</h3>
                  <p className="text-sm text-slate-500">Aucun signalement en cours. Vos locataires sont satisfaits !</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-10">
                  {(() => {
                    const filteredInteractions = interactions.filter(ticket => filterRessource === "all" || ticket.Ressources?.id === parseInt(filterRessource));
                    if (filteredInteractions.length === 0) {
                      return (
                        <div className="col-span-1 md:col-span-2 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                          <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                          <h3 className="font-extrabold text-slate-900 mb-1">Aucun signalement</h3>
                          <p className="text-sm text-slate-500">Aucune panne n'a été signalée pour cet équipement.</p>
                        </div>
                      );
                    }
                    return filteredInteractions.map((ticket) => (
                      <motion.div 
                        key={ticket.id}
                        whileHover={{ y: -4 }}
                        className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full"
                      >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-slate-100/80 dark:bg-white/5 text-slate-800 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 dark:border-white/10">
                                {ticket.Ressources?.name || "Ressource inconnue"}
                              </span>
                            </div>
                            <span className={cn(
                              "text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                              ticket.status === 'pending' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" :
                              ticket.status === 'in_progress' ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                              "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            )}>
                              {ticket.status === 'pending' ? 'À traiter' : ticket.status === 'in_progress' ? 'En cours' : 'Résolu'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                            <div className="w-6 h-6 bg-slate-200 dark:bg-white/10 rounded-full flex items-center justify-center shrink-0">
                              <UserIcon className="w-3 h-3 text-slate-500" />
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Signalé par <strong className="text-slate-900 dark:text-white">{ticket.Utilisateurs?.first_name} {ticket.Utilisateurs?.last_name}</strong>
                              {ticket.created_at && ` • ${new Date(ticket.created_at).toLocaleDateString('fr-FR')}`}
                            </div>
                          </div>

                          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed flex-1">
                            {ticket.issue_description}
                          </p>

                          {ticket.photo_url && (
                            <div className="mt-4">
                              <a href={ticket.photo_url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Ouvrir l'image</span>
                                </div>
                                <img src={ticket.photo_url} alt="Preuve" className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                              </a>
                            </div>
                          )}
                          
                          {ticket.admin_reply && (
                            <div className="mt-4 bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-xl">
                              <div className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1.5">Votre réponse</div>
                              <p className="text-sm text-slate-800 dark:text-slate-300">{ticket.admin_reply}</p>
                            </div>
                          )}
                          
                          {ticket.status !== 'resolved' && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
                              <div className="flex gap-2">
                                {ticket.status === 'pending' && (
                                  <button 
                                    disabled={processingTicketId === ticket.id}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    onClick={() => handleSetTicketStatus(ticket.id, 'in_progress')}
                                  >
                                    {processingTicketId === ticket.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                                    {processingTicketId === ticket.id ? "Traitement..." : "Marquer En cours"}
                                  </button>
                                )}
                                {ticket.status === 'in_progress' && !ticket.admin_reply && (
                                  <button 
                                    disabled={!replyTexts[ticket.id] || processingTicketId === ticket.id}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    onClick={() => handleReplyTicket(ticket.id)}
                                  >
                                    {processingTicketId === ticket.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    {processingTicketId === ticket.id ? "Envoi..." : "Résolu & répondre"}
                                  </button>
                                )}
                              </div>
                              {/* Reply textarea for in_progress tickets */}
                              {ticket.status === 'in_progress' && !ticket.admin_reply && (
                                <textarea 
                                  placeholder="Écrivez votre réponse (ex: Intervention prévue pour lundi)..."
                                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
                                  rows={2}
                                  value={replyTexts[ticket.id] || ""}
                                  onChange={(e) => setReplyTexts(prev => ({...prev, [ticket.id]: e.target.value}))}
                                />
                              )}
                            </div>
                          )}
                      </motion.div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === "parametres" && (
            <BuildingSettingsTab 
              batiment={batiment} 
              onDelete={() => setShowDeleteConfirm(true)}
              deleteLoading={loading}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-white/10"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-3">Action Irréversible</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement <span className="font-bold text-slate-900 dark:text-white">{batiment.nom}</span> ? 
              Toutes les données (locataires, annonces, tickets) seront supprimées pour toujours.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl font-bold text-sm transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteBuilding}
                disabled={loading}
                className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Oui, Supprimer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION RESSOURCE */}
      {resToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Supprimer la ressource ?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center text-xs mb-6">Tous les tickets d'intervention liés seront également supprimés.</p>
            <div className="flex gap-3">
              <button onClick={() => setResToDelete(null)} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white rounded-xl font-bold text-xs transition-all">Annuler</button>
              <button 
                onClick={handleDeleteRessource}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION ANNONCE */}
      {annToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Supprimer l'annonce ?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center text-xs mb-6">Cette action ne peut pas être annulée.</p>
            <div className="flex gap-3">
              <button onClick={() => setAnnToDelete(null)} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white rounded-xl font-bold text-xs transition-all">Annuler</button>
              <button 
                onClick={handleDeleteAnnonce}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
