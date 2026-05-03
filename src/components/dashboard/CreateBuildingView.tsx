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



export default function CreateBuildingView({ user, onBack }: { user: User, onBack: () => void }) {
  const [nom, setNom] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [description, setDescription] = useState("");
  const [adresse, setAdresse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [cropTarget, setCropTarget] = useState<{type: 'avatar' | 'banner', src: string} | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropTarget({ type, src: event.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    if (cropTarget?.type === 'avatar') {
      setAvatarFile(croppedFile);
    } else if (cropTarget?.type === 'banner') {
      setBannerFile(croppedFile);
    }
    setCropTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Étape 1 : Générer un code d'invitation unique (6 caractères alphanumériques)
      const code_invitation = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Étape 2 : Upload avatar et bannière si présentes
      let avatar_url: string | null = null;
      let banner_url: string | null = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `building-avatar-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("fichiers_batima").upload(fileName, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("fichiers_batima").getPublicUrl(fileName);
        avatar_url = data.publicUrl;
      }

      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `building-banner-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("fichiers_batima").upload(fileName, bannerFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("fichiers_batima").getPublicUrl(fileName);
        banner_url = data.publicUrl;
      }

      // Étape 3 : Insérer le bâtiment dans la table "Batiments"
      const { data: batiment, error: batError } = await supabase
        .from("batiments")
        .insert({ 
          nom, 
          code_invitation, 
          mot_de_passe: motDePasse,
          description: description || null,
          adresse: adresse || null,
          avatar_url,
          banner_url
        })
        .select()
        .single();

      if (batError) throw batError;

      // Étape 4 : Lier l'utilisateur au bâtiment via "Membres_Batiments" avec le rôle "proprio"
      const { error: memError } = await supabase
        .from("membres_batiments")
        .insert({
          user_id: user.id,
          batiment_id: batiment.id,
          role: "proprio"
        });

      if (memError) throw memError;

      onBack(); // Retour à la liste

    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Une erreur s'est produite lors de la création.";
      setError(msg);
      alert("Erreur: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Plus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Créer une Infrastructure</h2>
          <p className="text-sm text-slate-500 mt-1">Configurez une nouvelle résidence pour la gérer.</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Bannière */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-2">Bannière de couverture</label>
            <div 
              className="relative w-full h-36 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 group cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => document.getElementById('create-banner-upload')?.click()}
            >
              {bannerFile ? (
                <img src={URL.createObjectURL(bannerFile)} alt="Bannière" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-sm font-semibold">Ajouter une bannière</span>
                  <span className="text-xs text-slate-400">Optionnel — 16:9 recommandé</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-lg">Modifier</span>
              </div>
              <input id="create-banner-upload" type="file" accept="image/*" onChange={e => handleFileSelect(e, 'banner')} className="hidden" />
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div 
              className={cn("relative w-20 h-20 rounded-2xl overflow-hidden group cursor-pointer shrink-0", avatarFile ? "bg-transparent" : "bg-slate-100 border-2 border-dashed border-slate-300")}
              onClick={() => document.getElementById('create-avatar-upload')?.click()}
            >
              {avatarFile ? (
                <img src={URL.createObjectURL(avatarFile)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-blue-600 bg-blue-50">
                  <Building className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-white" />
              </div>
              <input id="create-avatar-upload" type="file" accept="image/*" onChange={e => handleFileSelect(e, 'avatar')} className="hidden" />
            </div>
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Icône / Avatar du bâtiment</p>
              <p>Optionnel — JPG, PNG. 512x512px recommandé.</p>
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

          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1">Nom de l'infrastructure *</label>
            <input 
              required
              className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Ex: Résidence Les Mimosas"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1">Description</label>
            <textarea 
              className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
              rows={3}
              placeholder="Décrivez votre infrastructure en quelques mots..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1">Adresse / Localisation</label>
            <input 
              className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Ex: 12 Rue des Lilas, 75000 Paris"
              value={adresse}
              onChange={e => setAdresse(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1">Mot de passe d'accès *</label>
            <input 
              required
              type="password"
              className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Sera demandé aux locataires"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-md px-4 py-2.5 font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours...</> : "Créer le bâtiment"}
            </button>
            {loading && <p className="text-[11px] text-slate-500 font-medium animate-pulse text-center">Cela peut prendre un peu de temps pour les grandes images...</p>}
          </div>
        </form>
      </div>
    </div>
  );
}