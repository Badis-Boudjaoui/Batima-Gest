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



export default function JoinBuildingView({ user, onBack }: { user: User, onBack: () => void }) {
  const [code, setCode] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Étape 1 : Vérifier la correspondance Code + Mot de passe dans "Batiments"
      const { data: batiment, error: batError } = await supabase
        .from("batiments")
        .select()
        .eq("code_invitation", code.toUpperCase())
        .eq("mot_de_passe", motDePasse)
        .single();

      if (batError || !batiment) {
        throw new Error("Code d'invitation ou mot de passe incorrect.");
      }

      // Étape 2 : Vérifier si l'utilisateur y est déjà
      const { data: exists } = await supabase
        .from("membres_batiments")
        .select()
        .eq("user_id", user.id)
        .eq("batiment_id", batiment.id)
        .maybeSingle();

      if (exists) {
        throw new Error("Vous êtes déjà membre de ce bâtiment.");
      }

      // Étape 3 : Vérifier si une demande est déjà en cours
      const { data: pending } = await supabase
        .from("demandes_adhesion")
        .select()
        .eq("user_id", user.id)
        .eq("batiment_id", batiment.id)
        .eq("status", "pending")
        .maybeSingle();

      if (pending) {
        throw new Error("Votre demande est déjà en attente de validation.");
      }

      // Étape 4 : Ajouter la demande d'adhésion
      const { error: memError } = await supabase
        .from("demandes_adhesion")
        .insert({
          user_id: user.id,
          batiment_id: batiment.id,
          status: "pending"
        });

      if (memError) throw memError;

      alert("🎉 Votre demande a été envoyée ! Le propriétaire doit maintenant l'accepter.");
      onBack(); // Retour à la liste

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Rejoindre un Bâtiment</h2>
          <p className="text-sm text-slate-500 mt-1">Demandez le code et le mot de passe à votre propriétaire.</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1">Code d'invitation</label>
            <input 
              required
              className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase"
              placeholder="Ex: X7F9P2"
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 mb-1">Mot de passe</label>
            <input 
              required
              type="password"
              className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="••••••••"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-md px-4 py-2.5 font-semibold hover:bg-blue-700 transition disabled:opacity-50 mt-2 text-sm"
          >
            {loading ? "Vérification..." : "Rejoindre"}
          </button>
        </form>
      </div>
    </div>
  );
}