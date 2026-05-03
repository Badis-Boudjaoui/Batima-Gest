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



export default function TiltCard({ onClick, children, className }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareOpacity = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
    glareOpacity.set(0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    glareOpacity.set(0);
  };

  return (
    <div 
      className={cn("relative w-full h-full", className)}
      style={{ perspective: "1200px" }}
    >
      <motion.div
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative w-full h-full transition-shadow duration-300 rounded-[28px]",
          onClick && "cursor-pointer"
        )}
      >
        {/* Dynamic Glare Effect */}
        <motion.div
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.4) 0%, transparent 80%)`,
            opacity: glareOpacity,
          }}
          className="absolute inset-0 pointer-events-none rounded-[28px] z-0"
        />

        <div
          style={{
            transform: "translateZ(60px)",
            transformStyle: "preserve-3d",
          }}
          className="w-full h-full"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}