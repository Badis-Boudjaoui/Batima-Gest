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



export default function MyProfileView({ user, onUpdateUser }: { user: User, onUpdateUser: (u: Partial<User>) => void }) {
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [profession, setProfession] = useState(user.profession || "");
  const [showRented, setShowRented] = useState<boolean>(
    user.show_rented_buildings !== undefined ? user.show_rented_buildings : true
  );
  const [file, setFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [cropTarget, setCropTarget] = useState<{type: 'avatar' | 'banner', src: string} | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    e.stopPropagation();
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
      setFile(croppedFile);
    } else if (cropTarget?.type === 'banner') {
      setBannerFile(croppedFile);
    }
    setCropTarget(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      let avatar_url = user.avatar_url;
      let banner_url = user.banner_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-avatar-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("fichiers_batima")
          .upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("fichiers_batima").getPublicUrl(fileName);
        avatar_url = publicUrlData.publicUrl;
      }

      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${user.id}-banner-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("fichiers_batima")
          .upload(fileName, bannerFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("fichiers_batima").getPublicUrl(fileName);
        banner_url = publicUrlData.publicUrl;
      }

      const updates: any = {
        first_name: firstName,
        last_name: lastName,
        bio,
        profession,
        show_rented_buildings: showRented,
      };
      
      if (avatar_url !== user.avatar_url) updates.avatar_url = avatar_url;
      if (banner_url !== user.banner_url) updates.banner_url = banner_url;

      const { error } = await supabase
        .from("utilisateurs")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      onUpdateUser(updates);
      setMsg("✅ Profil mis à jour avec succès !");
    } catch (err: any) {
      console.error(err);
      setMsg("❌ Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-blue-600"></div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-2 tracking-tight">
          <UserIcon className="w-6 h-6 text-blue-600" /> Paramètres du profil
        </h2>
        
        <AnimatePresence>
          {msg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className={cn("p-4 mb-8 rounded-xl text-sm font-bold border flex items-center gap-2", msg.includes("✅") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")}
            >
              {msg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Bannière */}
          <div className="space-y-3">
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-widest">Image de couverture</label>
            <div className="w-full h-40 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 hover:border-blue-400 flex items-center justify-center overflow-hidden shrink-0 relative group transition-colors cursor-pointer" onClick={() => document.getElementById('banner-upload')?.click()}>
              {bannerFile ? (
                <img src={URL.createObjectURL(bannerFile)} alt="Preview Banner" className="w-full h-full object-cover" />
              ) : user.banner_url ? (
                <img src={user.banner_url} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="text-slate-400 text-sm font-semibold flex flex-col items-center">
                  <UploadCloud className="w-8 h-8 mb-2 text-slate-300" />
                  Ajouter une couverture
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="text-white text-sm font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Changer la couverture</span>
              </div>
              <input 
                id="banner-upload"
                type="file" 
                accept="image/*" 
                onChange={e => handleFileSelect(e, 'banner')}
                className="hidden"
              />
            </div>
          </div>

          {/* Photo de profil */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className={cn("w-24 h-24 rounded-full flex items-center justify-center overflow-hidden shrink-0 relative group cursor-pointer", (file || user.avatar_url) ? "bg-transparent border-none shadow-none" : "bg-white border-4 border-slate-200 shadow-sm")} onClick={() => document.getElementById('avatar-upload')?.click()}>
              {file ? (
                <img src={URL.createObjectURL(file)} alt="Preview Avatar" className="w-full h-full object-cover" />
              ) : user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-slate-300" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <UploadCloud className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-widest mb-1.5">Photo de profil</label>
              <p className="text-xs text-slate-500 mb-3 max-w-sm">Une photo vous aide à être reconnu par vos propriétaires et voisins.</p>
              <button 
                 type="button"
                 onClick={() => document.getElementById('avatar-upload')?.click()}
                 className="px-4 py-2 bg-white border border-slate-200 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors"
              >
                Parcourir les fichiers
              </button>
              <input 
                id="avatar-upload"
                type="file" 
                accept="image/*" 
                onChange={e => handleFileSelect(e, 'avatar')}
                className="hidden"
              />
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

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
               <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-widest mb-2">Prénom</label>
               <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all hover:border-slate-300 font-medium text-slate-800" placeholder="Votre prénom" />
            </div>
            <div>
               <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-widest mb-2">Nom de famille</label>
               <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all hover:border-slate-300 font-medium text-slate-800" placeholder="Votre nom" />
            </div>
          </div>

          <div>
             <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-widest mb-2">Profession / Rôle (ex: Plombier, Étudiant...)</label>
             <input 
              type="text"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all hover:border-slate-300 font-medium text-slate-800"
              placeholder="Ex: Architecte d'intérieur"
              value={profession}
              onChange={e => setProfession(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-widest mb-2">Biographie</label>
            <textarea 
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all hover:border-slate-300 resize-none font-medium text-slate-800"
              placeholder="Décrivez-vous en quelques mots..."
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Afficher mes infrastructures louées</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">Les autres utilisateurs pourront voir les infrastructures où vous êtes locataire depuis votre profil.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={showRented} onChange={(e) => setShowRented(e.target.checked)} className="sr-only peer" />
              <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex flex-col gap-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde en cours...</span>
                ) : (
                  <><ShieldCheck className="w-5 h-5" /> Enregistrer les modifications</>
                )}
              </button>
              {loading && <p className="text-[11px] text-slate-500 font-medium animate-pulse text-center">Cela peut prendre un peu de temps pour les grandes images...</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}