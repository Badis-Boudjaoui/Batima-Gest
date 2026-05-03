"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { api } from "../services/api";
import { cn } from "../lib/utils";
import Auth from "./Auth";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, LayoutGroup } from "motion/react";
import DarkVeil from "./DarkVeil";
import { Magnetic } from "./ui/magnetic";
import Dock from "./Dock";
import { MaskedAvatars } from "./ui/masked-avatars";
import BorderGlow from "./ui/BorderGlow";
import ImageCropperModal from "./ui/ImageCropperModal";
import AnimatedLogo from "./ui/AnimatedLogo";
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


import { User, Batiment, Membre, Ressource } from "../types";

import { SearchResultCard } from "./dashboard/SearchResultCard";
import TiltCard from "./dashboard/TiltCard";
import TiltContainer from "./dashboard/TiltContainer";
import BuildingsView from "./dashboard/BuildingsView";
import CreateBuildingView from "./dashboard/CreateBuildingView";
import JoinBuildingView from "./dashboard/JoinBuildingView";
import BuildingSettingsTab from "./dashboard/BuildingSettingsTab";
import ManageBuildingView from "./dashboard/ManageBuildingView";
import LocataireDashboardView from "./dashboard/LocataireDashboardView";
import MyProfileView from "./dashboard/MyProfileView";
import UserProfileView from "./dashboard/UserProfileView";
import BuildingProfileView from "./dashboard/BuildingProfileView";
import MessagesView from "./dashboard/MessagesView";
import SettingsView from "./dashboard/SettingsView";
import LandingPage from "./LandingPage";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Thème
  const [theme, setTheme] = useState<"light" | "oled">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('app-theme') as "light" | "oled") || "oled";
    }
    return "oled";
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
    if (theme === "oled") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "oled" : "light");
  };

  const [view, setView] = useState<"list" | "create" | "join" | "manage" | "locataire" | "my_profile" | "search" | "user_profile" | "messages" | "building_profile" | "settings">("list");
  
  // Contexte pour la vue profil utilisateur externe
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  // Contexte pour la vue profil bâtiment externe
  const [targetBuildingId, setTargetBuildingId] = useState<string | null>(null);

  // Contexte du bâtiment sélectionné pour les actions
  const [activeBatiment, setActiveBatiment] = useState<Batiment | null>(null);
  const [activeRole, setActiveRole] = useState<"proprio" | "locataire">("locataire");

  // Etat d'ouverture de la barre de recherche dans le dock
  const [isSearchDockExpanded, setIsSearchDockExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dockSearchTerm, setDockSearchTerm] = useState("");
  const [dockSearchResults, setDockSearchResults] = useState<{users: any[], buildings: any[]}>({users: [], buildings: []});
  const [isDockSearching, setIsDockSearching] = useState(false);
  const [hoveredSearchResultId, setHoveredSearchResultId] = useState<string | null>(null);

  useEffect(() => {
    // Premier fetch au montage
    fetchUserData();

    // Ecouteur des changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {

      if (event === "SIGNED_IN") {
        setView("list");
        fetchUserData();
      } else if (event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        fetchUserData();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setMembres([]);
        setAuthError(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effectuer la recherche dock inline
  useEffect(() => {
    if (dockSearchTerm.trim().length < 2) {
      setDockSearchResults({users: [], buildings: []});
      return;
    }
    const search = async () => {
      setIsDockSearching(true);
      try {
        const [usersRes, buildingsRes] = await Promise.all([
          supabase
            .from("utilisateurs")
            .select("id, first_name, last_name, avatar_url, profession")
            .or(`first_name.ilike.%${dockSearchTerm}%,last_name.ilike.%${dockSearchTerm}%`)
            .limit(4),
          supabase
            .from("batiments")
            .select("id, nom, avatar_url, adresse")
            .ilike("nom", `%${dockSearchTerm}%`)
            .limit(4)
        ]);
        
        setDockSearchResults({
          users: usersRes.data || [],
          buildings: buildingsRes.data || []
        });
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsDockSearching(false);
      }
    };
    
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [dockSearchTerm]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Récupération de l'utilisateur connecté
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !authUser) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      setAuthError(false);
      
      // Récupérer les détails complets de l'utilisateur (nom, avatar, bio)
      const { data: userDetails } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (userDetails) {
        setUser({ 
          id: authUser.id, 
          first_name: userDetails.first_name,
          last_name: userDetails.last_name,
          avatar_url: userDetails.avatar_url,
          banner_url: userDetails.banner_url,
          profession: userDetails.profession,
          bio: userDetails.bio,
          show_rented_buildings: userDetails.show_rented_buildings
        });
      } else {
        setUser({ id: authUser.id });
      }

      // Récupération des bâtiments liés à l'utilisateur et des autres membres
      const { data: memberships, error: memError } = await supabase
        .from("membres_batiments")
        .select(`
          role,
          Batiments:batiments (
            id,
            nom,
            code_invitation,
            description,
            adresse,
            avatar_url,
            banner_url,
            mot_de_passe,
            autres_membres:membres_batiments (
              utilisateurs (
                id,
                first_name,
                last_name,
                avatar_url
              )
            )
          )
        `)
        .eq("user_id", authUser.id);

      if (memError) throw memError;

      // Supabase nested joins occasionally return Arrays, we ensure types here
      const formattedMembres = (memberships || []).map((m: any) => ({
        role: m.role,
        Batiments: Array.isArray(m.Batiments) ? m.Batiments[0] : m.Batiments,
      })) as Membre[];

      setMembres(formattedMembres);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center relative overflow-hidden bg-black">
        <DarkVeil speed={0.8} noiseIntensity={0.08} hueShift={280} />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <AnimatedLogo size={80} loop={true} />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-3"
          >
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-blue-400 bg-clip-text text-transparent font-bold tracking-[0.3em] text-[11px] uppercase">
              Initialisation
            </span>
            <div className="flex gap-1">
               <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
               <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
               <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (authError || !user) {
    if (showAuth) {
      return <Auth onLogin={() => { setView("list"); fetchUserData(); }} onBack={() => setShowAuth(false)} />;
    } else {
      return <LandingPage onLoginClick={() => setShowAuth(true)} />;
    }
  }

  // Fonctions de Navigation
  const goToList = () => {
    setView("list");
    setActiveBatiment(null);
    fetchUserData(); // Rafraîchir les données
  };

  const openManage = (batiment: Batiment) => {
    setActiveBatiment(batiment);
    setActiveRole("proprio");
    setView("manage");
  };

  const openReport = (batiment: Batiment) => {
    setActiveBatiment(batiment);
    setActiveRole("locataire");
    setView("locataire");
  };

  const handleLeaveBuilding = async (batimentId: string | number) => {
    if (!batimentId) {
      alert("Erreur: ID du bâtiment manquant.");
      return;
    }
    

    
    try {
      // On s'assure que l'ID est bien un nombre
      const batIdNumeric = typeof batimentId === 'string' ? parseInt(batimentId, 10) : batimentId;
      
      if (isNaN(batIdNumeric)) {
        throw new Error("ID de bâtiment invalide.");
      }



      // 1. Suppression du membre via l'API (contourne parfois RLS en passant par l'ID)
      try {
        await api.removeMember(user.id, batIdNumeric);
      } catch (error: any) {
        console.error("Supabase Error:", error);
        
        // Détection de l'erreur de récursion (RLS)
        if (error.code === '42P17') {
          throw new Error("RLS_RECURSION");
        }
        throw new Error(error.message || "Erreur inconnue");
      }


      
      // 2. Rafraîchissement et Navigation
      await fetchUserData();
      setView("list");
      setActiveBatiment(null);
      
    } catch (err: any) {
      console.error("Leave error:", err);
      
      if (err.message === "RLS_RECURSION") {
        alert("🚨 BLOQUAGE SUPABASE DÉTECTÉ 🚨\n\nVos règles RLS sur Supabase sont mal configurées (Erreur 42P17 : boucle infinie).\n\nCORRECTION :\n1. Allez dans Supabase > SQL Editor\n2. Collez le code SQL que je vous ai donné dans le chat\n3. Cliquez sur RUN\n\nSans cela, la suppression sera TOUJOURS bloquée par votre base de données.");
      } else {
        alert(`Erreur : ${err.message}`);
      }
    }
  };

  const handleNavClick = (targetView: typeof view) => {
    setView(targetView);
    if (targetView !== "search") {
      setIsSearchDockExpanded(false);
      setTimeout(() => setDockSearchTerm(""), 300);
    }
  };

  const dockItems = [
    { icon: <Building size={20} />, label: 'Batiments', onClick: () => handleNavClick("list") },
    { 
      customWidth: isSearchDockExpanded ? 280 : undefined,
      icon: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Default Search Icon - visible when collapsed */}
          <motion.div
            initial={false}
            animate={{ opacity: isSearchDockExpanded ? 0 : 1, scale: isSearchDockExpanded ? 0.8 : 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Search size={20} />
          </motion.div>

          {/* Expanded Search Content - visible when expanded */}
          <motion.div
             initial={false}
             animate={{ opacity: isSearchDockExpanded ? 1 : 0, filter: isSearchDockExpanded ? "blur(0px)" : "blur(4px)" }}
             transition={{ duration: 0.3 }}
             className={cn("absolute inset-0 flex items-center w-full h-full pl-4 pr-10", isSearchDockExpanded ? "pointer-events-auto" : "pointer-events-none")}
          >
            <Search size={16} className="shrink-0 mr-2 text-slate-400 dark:text-slate-500" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Rechercher..." 
              value={dockSearchTerm}
              onChange={(e) => {
                 setDockSearchTerm(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsSearchDockExpanded(false);
                  searchInputRef.current?.blur();
                  setTimeout(() => setDockSearchTerm(""), 300); // Wait for transition
                }
              }}
              className="w-full !bg-transparent !border-none text-sm font-medium outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 appearance-none"
              style={{ backgroundColor: 'transparent' }}
            />
            <AnimatePresence>
              {dockSearchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDockSearchTerm("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      ), 
      label: isSearchDockExpanded ? null : 'Explorer', 
      onClick: () => { 
        if(!isSearchDockExpanded) {
           setIsSearchDockExpanded(true);
           setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      } 
    },
    { icon: <MessageCircle size={20} />, label: 'Messages', onClick: () => { setTargetUserId(null); handleNavClick("messages"); } },
    { 
      icon: (
        <div className="relative w-full h-full flex items-center justify-center">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Profil" title="Profil" className="absolute inset-0 w-full h-full rounded-full object-cover pointer-events-none" />
          ) : (
            <UserIcon size={20} />
          )}
          {/* Green Online Dot */}
          <div className="absolute bottom-[-2px] right-[-2px] w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full z-10 shadow-sm pointer-events-none"></div>
        </div>
      ), 
      label: 'Mon Profil', 
      onClick: () => handleNavClick("my_profile") 
    },
    { icon: <Wrench size={20} />, label: 'Paramètres', onClick: () => handleNavClick("settings") }
  ];

  return (
    <div className="min-h-screen text-slate-800 font-sans relative overflow-x-hidden selection:bg-purple-200 selection:text-purple-900">
      {/* Background Layer: Fluid Shader */}
      <DarkVeil 
        speed={0.15} 
        noiseIntensity={0.015} 
        scanlineIntensity={0.03} 
        warpAmount={0.25}
        hueShift={280} // Violet
      />
      
      <div className="fixed inset-0 bg-purple-900/5 z-[-10] pointer-events-none opacity-50"></div>
      
      {/* Clean Floating Logo */}
      <header className="absolute top-6 left-0 right-0 flex justify-center sm:justify-start sm:left-8 z-50 pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 font-black text-2xl tracking-tighter cursor-pointer pointer-events-auto"
          onClick={() => setView("list")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatedLogo size={34} />
          <span className="text-slate-900 dark:text-white transition-colors drop-shadow-sm">
            Batima<span className="text-purple-600">Gest</span>
          </span>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-20 sm:pt-24 pb-24 sm:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (activeBatiment ? activeBatiment.id : "")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === "list" && (
              <BuildingsView 
                membres={membres} 
                onCreate={() => setView("create")} 
                onJoin={() => setView("join")} 
                onManage={openManage}
                onReport={openReport}
                onLeaveBuilding={handleLeaveBuilding}
              />
            )}
            {view === "create" && <CreateBuildingView user={user} onBack={goToList} />}
            {view === "join" && <JoinBuildingView user={user} onBack={goToList} />}
            
            {view === "manage" && activeBatiment && activeRole === "proprio" && (
              <ManageBuildingView 
                batiment={activeBatiment} 
                onBack={goToList} 
                user={user} 
                onViewUser={(id: string) => { setTargetUserId(id); setView("user_profile"); }}
                onViewBuilding={(id: string) => { setTargetBuildingId(id); setView("building_profile"); }}
              />
            )}
            
            {view === "locataire" && activeBatiment && activeRole === "locataire" && (
              <LocataireDashboardView 
                user={user} 
                batiment={activeBatiment} 
                onBack={goToList} 
                onLeaveBuilding={() => { return handleLeaveBuilding(activeBatiment.id); }} 
                onViewBuilding={() => { setTargetBuildingId(activeBatiment.id); setView("building_profile"); }}
                onViewUser={(id: string) => { setTargetUserId(id); setView("user_profile"); }}
              />
            )}

            {view === "my_profile" && (
              <MyProfileView 
                user={user} 
                onUpdateUser={(updated) => setUser({ ...user, ...updated })} 
              />
            )}

            {view === "search" && (
               <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                  <Search className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-medium">Utilisez la barre de recherche en bas pour trouver des utilisateurs et des bâtiments.</p>
               </div>
            )}

            {view === "user_profile" && targetUserId && (
              <UserProfileView 
                userId={targetUserId} 
                currentUserId={user.id}
                onSendMessage={(id) => { setTargetUserId(id); setView("messages"); }}
                onViewBuilding={(id) => { setTargetBuildingId(id); setView("building_profile"); }}
              />
            )}

            {view === "building_profile" && targetBuildingId && (
              <BuildingProfileView 
                buildingId={targetBuildingId}
                currentUserId={user.id}
                onBack={() => setView("search")}
                onMessageProprio={(id) => { setTargetUserId(id); setView("messages"); }}
              />
            )}

            {view === "messages" && (
              <MessagesView 
                currentUserId={user.id}
                initialTargetUserId={targetUserId}
                onViewUser={(id) => { setTargetUserId(id); setView("user_profile"); }}
              />
            )}

            {view === "settings" && (
              <SettingsView 
                theme={theme}
                toggleTheme={toggleTheme}
                onBack={goToList}
                user={user}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modern Mac-Like Dock */}
      <div>
        <AnimatePresence>
          {isSearchDockExpanded && dockSearchTerm.trim().length >= 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.9, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 15, scale: 0.9, filter: "blur(5px)" }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="fixed bottom-[95px] left-1/2 -translate-x-1/2 w-[90vw] sm:w-[320px] bg-white/70 dark:bg-black/70 backdrop-blur-3xl rounded-[1.5rem] border border-black/10 dark:border-white/10 shadow-[0_20px_40px_-5px_rgba(0,0,0,0.2)] overflow-hidden z-[60] p-2 ring-1 ring-black/5 dark:ring-white/5 origin-bottom"
            >
              <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                {isDockSearching ? (
                  <div className="py-4 text-center text-sm font-medium text-slate-500 flex justify-center items-center gap-2">
                    <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    Recherche...
                  </div>
                ) : (
                  <>
                    {(dockSearchResults.users.length === 0 && dockSearchResults.buildings.length === 0) ? (
                      <div className="py-4 text-center text-sm font-medium text-slate-500">Aucun résultat.</div>
                    ) : (
                      <LayoutGroup id="search-dropdown">
                        <motion.div 
                          initial="hidden" 
                          animate="show" 
                          variants={{
                            hidden: {},
                            show: {
                              transition: { staggerChildren: 0.04 }
                            }
                          }}
                        >
                          {dockSearchResults.users.length > 0 && (
                            <div className="mb-2 relative">
                              <motion.div 
                                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                                className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/40 dark:bg-black/40 backdrop-blur-md sticky top-0 z-20"
                              >
                                Utilisateurs
                              </motion.div>
                              <div className="px-1 py-1 relative">
                                {dockSearchResults.users.map((u) => (
                                  <SearchResultCard 
                                    key={u.id}
                                    item={u}
                                    type="user"
                                    hoveredId={hoveredSearchResultId}
                                    setHoveredId={setHoveredSearchResultId}
                                    onClick={() => { setTargetUserId(u.id); setView("user_profile"); setIsSearchDockExpanded(false); setTimeout(() => setDockSearchTerm(""), 300); }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {dockSearchResults.buildings.length > 0 && (
                            <div className="relative">
                              <motion.div 
                                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                                className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/40 dark:bg-black/40 backdrop-blur-md sticky top-0 z-20"
                              >
                                Bâtiments
                              </motion.div>
                              <div className="px-1 py-1 relative">
                                {dockSearchResults.buildings.map((b) => (
                                  <SearchResultCard 
                                    key={b.id}
                                    item={b}
                                    type="building"
                                    hoveredId={hoveredSearchResultId}
                                    setHoveredId={setHoveredSearchResultId}
                                    onClick={() => { setTargetBuildingId(b.id); setView("building_profile"); setIsSearchDockExpanded(false); setTimeout(() => setDockSearchTerm(""), 300); }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </LayoutGroup>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Dock 
          items={dockItems} 
          panelHeight={68} 
          baseItemSize={48} 
          magnification={65} 
        />
      </div>
    </div>
  );
}
