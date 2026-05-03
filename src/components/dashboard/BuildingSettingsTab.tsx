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



export default function BuildingSettingsTab({ batiment, onDelete, deleteLoading }: { batiment: Batiment, onDelete?: () => void, deleteLoading?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [nom, setNom] = useState(batiment.nom || "");
  const [desc, setDesc] = useState(batiment.description || "");
  const [adresse, setAdresse] = useState(batiment.adresse || "");
  const [motDePasse, setMotDePasse] = useState(batiment.mot_de_passe || "");
  const [avatarPreview, setAvatarPreview] = useState(batiment.avatar_url || "");
  const [bannerPreview, setBannerPreview] = useState(batiment.banner_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [cropTarget, setCropTarget] = useState<{type: 'avatar' | 'banner', src: string} | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropTarget({ type: 'avatar', src: event.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropTarget({ type: 'banner', src: event.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    if (cropTarget?.type === 'avatar') {
      setAvatarFile(croppedFile);
      setAvatarPreview(URL.createObjectURL(croppedFile));
    } else if (cropTarget?.type === 'banner') {
      setBannerFile(croppedFile);
      setBannerPreview(URL.createObjectURL(croppedFile));
    }
    setCropTarget(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let finalAvatarUrl = batiment.avatar_url;
      let finalBannerUrl = batiment.banner_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatar-${batiment.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("fichiers_batima").upload(fileName, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("fichiers_batima").getPublicUrl(fileName);
        finalAvatarUrl = data.publicUrl;
      }

      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `banner-${batiment.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("fichiers_batima").upload(fileName, bannerFile, { upsert: true });
        if (uploadError) {
          throw uploadError;
        }
        const { data } = supabase.storage.from("fichiers_batima").getPublicUrl(fileName);
        finalBannerUrl = data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("batiments")
        .update({
          nom,
          description: desc,
          adresse: adresse,
          mot_de_passe: motDePasse,
          avatar_url: finalAvatarUrl,
          banner_url: finalBannerUrl
        })
        .eq("id", batiment.id);

      if (updateError) {
        throw updateError;
      }
      
      setSuccess("Paramètres du bâtiment mis à jour avec succès ! (Rechargez la page si nécessaire)");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Une erreur est survenue lors de la mise à jour";
      setError(msg);
      alert("Erreur: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto">
      <h3 className="font-extrabold text-slate-900 text-lg mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-500" />
        Paramètres du Bâtiment
      </h3>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>}
      {success && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-4 border border-emerald-200">{success}</div>}

      <div className="space-y-6">
        {/* Banner Upload */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">Bannière de l'infrastructure (16:9 recommandé)</label>
          <div className="relative w-full h-40 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 group cursor-pointer">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Bannière" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm font-semibold">Ajouter une bannière</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-lg">Modifier</span>
            </div>
            <input type="file" accept="image/*" onChange={handleBannerChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-2">Avatar / Icône du bâtiment</label>
          <div className="flex items-center gap-4">
            <div className={cn("relative w-20 h-20 rounded-2xl overflow-hidden group cursor-pointer shrink-0", avatarPreview ? "bg-transparent border-none shadow-none" : "bg-slate-100 border-2 border-slate-200 shadow-sm")}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-blue-600 bg-blue-50">
                  <Building className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                <UploadCloud className="w-5 h-5 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Image de profil</p>
              <p>Recommandé: 512x512px. JPG, PNG ou GIF.</p>
            </div>
          </div>
        </div>

        <ImageCropperModal
          isOpen={cropTarget !== null}
          imageSrc={cropTarget?.src || null}
          onClose={() => setCropTarget(null)}
          onCropCompleteAction={handleCropComplete}
          aspectRatio={cropTarget?.type === 'banner' ? 16 / 9 : 1}
          title={cropTarget?.type === 'banner' ? "Recadrer la bannière" : "Recadrer l'avatar"}
        />

        {/* Invitation Code (read-only) */}
        <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Code d'invitation</label>
            <p className="text-[11px] text-slate-400">Partagez ce code aux locataires pour qu'ils puissent rejoindre votre infrastructure.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl shadow-inner">
            <KeyRound className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-[0.3em] select-all">{batiment.code_invitation}</span>
          </div>
        </div>

        {/* Text Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1">Nom de l'infrastructure</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1">Mot de passe (pour rejoindre)</label>
            <input type="text" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1">Description</label>
          <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ajoutez une description pour votre infrastructure..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"></textarea>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1">Localisation / Adresse</label>
          <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Ex: 12 Rue des Lilas, 75000 Paris" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-100 gap-4">
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-red-600 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" /> Zone de danger
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">La suppression est définitive et irréversible.</p>
          </div>
          
          <div className="flex gap-3">
            {onDelete && (
              <button 
                onClick={onDelete}
                disabled={deleteLoading || loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Supprimer l'infra
              </button>
            )}
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={handleSave} 
                disabled={loading || deleteLoading}
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[180px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : "Sauvegarder"}
              </button>
              {loading && <p className="text-[11px] text-slate-500 font-medium animate-pulse">Cela peut prendre un peu de temps...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}