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
  Sliders,
  ArrowLeft
} from "lucide-react";


import { User, Batiment, Membre, Ressource } from "../../types";



export default function MessagesView({ currentUserId, initialTargetUserId, onViewUser }: { currentUserId: string, initialTargetUserId: string | null, onViewUser: (id: string) => void }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(initialTargetUserId);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatUser, setChatUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  // Mobile panel state: 'list' or 'chat'
  const [mobilePanel, setMobilePanel] = useState<'list' | 'chat'>(initialTargetUserId ? 'chat' : 'list');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeChatUserId) {
      fetchMessages(activeChatUserId);
      fetchChatUserDetails(activeChatUserId);
    }
  }, [activeChatUserId]);

  // B6: Supabase Realtime subscription for live messaging
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const newMsg = payload.new;
          // Only handle messages that involve the current user
          if (newMsg.sender_id === currentUserId || newMsg.receiver_id === currentUserId) {
            // If the message belongs to the active chat, append it
            if (
              activeChatUserId &&
              ((newMsg.sender_id === currentUserId && newMsg.receiver_id === activeChatUserId) ||
               (newMsg.sender_id === activeChatUserId && newMsg.receiver_id === currentUserId))
            ) {
              setMessages(prev => {
                // Avoid duplicates (in case we already added it optimistically)
                if (prev.some((m: any) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
            // Always refresh conversations list for sidebar update
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeChatUserId]);

  const fetchConversations = async () => {
    const { data: sentMessages } = await supabase
      .from('messages')
      .select('receiver_id, created_at, contenu, Utilisateurs:utilisateurs!messages_receiver_id_fkey(id, first_name, last_name, avatar_url, profession)')
      .eq('sender_id', currentUserId)
      .order('created_at', { ascending: false });

    const { data: receivedMessages } = await supabase
      .from('messages')
      .select('sender_id, created_at, contenu, Utilisateurs:utilisateurs!messages_sender_id_fkey(id, first_name, last_name, avatar_url, profession)')
      .eq('receiver_id', currentUserId)
      .order('created_at', { ascending: false });

    const map = new Map();
    
    sentMessages?.forEach((m: any) => {
      const otherId = m.receiver_id;
      const userObj = Array.isArray(m.Utilisateurs) ? m.Utilisateurs[0] : m.Utilisateurs;
      if (!map.has(otherId) || new Date(m.created_at) > new Date(map.get(otherId).latest_date)) {
        map.set(otherId, {
          user: userObj,
          latest_message: m.contenu,
          latest_date: m.created_at
        });
      }
    });

    receivedMessages?.forEach((m: any) => {
      const otherId = m.sender_id;
      const userObj = Array.isArray(m.Utilisateurs) ? m.Utilisateurs[0] : m.Utilisateurs;
      if (!map.has(otherId) || new Date(m.created_at) > new Date(map.get(otherId).latest_date)) {
        map.set(otherId, {
          user: userObj,
          latest_message: m.contenu,
          latest_date: m.created_at
        });
      }
    });

    let convos = Array.from(map.values()).sort((a, b) => new Date(b.latest_date).getTime() - new Date(a.latest_date).getTime());
    
    if (activeChatUserId && !map.has(activeChatUserId)) {
      const { data } = await supabase.from('utilisateurs').select('id, first_name, last_name, avatar_url, profession').eq('id', activeChatUserId).single();
      if (data) {
        setConversations((prev) => {
          if (prev.some(c => c.user?.id === activeChatUserId)) return prev;
          return [{
            user: data,
            latest_message: "Nouvelle discussion",
            latest_date: new Date().toISOString()
          }, ...prev];
        });
      }
    }
    
    setConversations(convos);
  };

  const fetchChatUserDetails = async (id: string) => {
    const { data } = await supabase.from('utilisateurs').select('*').eq('id', id).single();
    if (data) setChatUser(data);
  };

  const fetchMessages = async (otherUserId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .in('sender_id', [currentUserId, otherUserId])
      .in('receiver_id', [currentUserId, otherUserId])
      .order('created_at', { ascending: true });
    
    if (data) {
      const validMessages = data.filter(m => 
        (m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
        (m.sender_id === otherUserId && m.receiver_id === currentUserId)
      );
      setMessages(validMessages);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatUserId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: activeChatUserId,
          contenu: newMessage.trim()
        });
      
      if (error) throw error;
      setNewMessage("");
      fetchMessages(activeChatUserId);
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  // Mobile: select conversation & switch to chat panel
  const handleSelectConversation = (userId: string) => {
    setActiveChatUserId(userId);
    if (isMobile) {
      setMobilePanel('chat');
    }
  };

  // Mobile: go back to conversation list
  const handleMobileBack = () => {
    setMobilePanel('list');
    // Don't clear active chat so the highlight remains on desktop if resized
  };

  // Format relative time for conversation list
  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Maintenant";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // ─── MOBILE LAYOUT ───────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="messages-mobile-container">
        <AnimatePresence mode="wait" initial={false}>
          {mobilePanel === 'list' ? (
            <motion.div
              key="mobile-list"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="messages-mobile-panel"
            >
              {/* Mobile Header */}
              <div className="messages-mobile-header">
                <div className="messages-mobile-header-content">
                  <div className="messages-mobile-header-icon">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="messages-mobile-title">Messages</h2>
                    <p className="messages-mobile-subtitle">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              {/* Conversations List */}
              <div className="messages-mobile-list">
                {conversations.length === 0 ? (
                  <div className="messages-mobile-empty">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="messages-mobile-empty-icon"
                    >
                      <MessageCircle className="w-8 h-8 text-purple-400/60" />
                    </motion.div>
                    <p className="messages-mobile-empty-title">Aucune conversation</p>
                    <p className="messages-mobile-empty-desc">Recherchez un utilisateur pour démarrer une discussion</p>
                  </div>
                ) : (
                  <div className="messages-mobile-conversations">
                    {conversations.map((c, idx) => (
                      <motion.div
                        key={c.user?.id || idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, type: "spring", stiffness: 500, damping: 35 }}
                        onClick={() => { if (c.user?.id) handleSelectConversation(c.user.id); }}
                        className={cn(
                          "messages-mobile-conv-item",
                          activeChatUserId === c.user?.id && "messages-mobile-conv-item--active"
                        )}
                      >
                        <div className={cn(
                          "messages-mobile-conv-avatar",
                          activeChatUserId === c.user?.id ? "messages-mobile-conv-avatar--active" : ""
                        )}>
                          {c.user?.avatar_url ? (
                            <img src={c.user.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className={cn("w-5 h-5", activeChatUserId === c.user?.id ? "text-white" : "text-slate-400")} />
                          )}
                        </div>
                        <div className="messages-mobile-conv-info">
                          <div className="messages-mobile-conv-top">
                            <span className={cn(
                              "messages-mobile-conv-name",
                              activeChatUserId === c.user?.id ? "text-white" : ""
                            )}>
                              {c.user?.first_name || "Utilisateur"} {c.user?.last_name || ""}
                            </span>
                            <span className={cn(
                              "messages-mobile-conv-time",
                              activeChatUserId === c.user?.id ? "text-purple-200" : ""
                            )}>
                              {formatRelativeTime(c.latest_date)}
                            </span>
                          </div>
                          <p className={cn(
                            "messages-mobile-conv-preview",
                            activeChatUserId === c.user?.id ? "text-purple-100" : ""
                          )}>
                            {c.latest_message}
                          </p>
                        </div>
                        <ChevronLeft className={cn(
                          "w-4 h-4 shrink-0 rotate-180 transition-transform",
                          activeChatUserId === c.user?.id ? "text-white/60" : "text-slate-300 dark:text-white/10"
                        )} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mobile-chat"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="messages-mobile-panel messages-mobile-chat-panel"
            >
              {activeChatUserId && chatUser ? (
                <>
                  {/* Mobile Chat Header */}
                  <div className="messages-mobile-chat-header">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleMobileBack}
                      className="messages-mobile-back-btn"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <div 
                      className="messages-mobile-chat-user"
                      onClick={() => onViewUser(activeChatUserId)}
                    >
                      <div className={cn(
                        "messages-mobile-chat-avatar",
                        chatUser.avatar_url ? "" : "messages-mobile-chat-avatar--placeholder"
                      )}>
                        {chatUser.avatar_url ? (
                          <img src={chatUser.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="messages-mobile-chat-user-info">
                        <h3 className="messages-mobile-chat-username">
                          {chatUser.first_name} {chatUser.last_name}
                        </h3>
                        {chatUser.profession && (
                          <p className="messages-mobile-chat-profession">{chatUser.profession}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Messages */}
                  <div className="messages-mobile-messages custom-scrollbar">
                    {messages.length === 0 && !loading && (
                      <div className="messages-mobile-messages-empty">
                        <div className="messages-mobile-messages-empty-pill">
                          <span>🔒</span>
                          <span>Messagerie sécurisée</span>
                        </div>
                        <p className="messages-mobile-messages-empty-text">
                          Commencez l'échange avec {chatUser.first_name}
                        </p>
                      </div>
                    )}
                    
                    <AnimatePresence initial={false}>
                      {messages.map((m, i) => {
                        const isMe = m.sender_id === currentUserId;
                        const prevMsg = i > 0 ? messages[i-1] : null;
                        const nextMsg = i < messages.length - 1 ? messages[i+1] : null;
                        const isGroupStart = !prevMsg || prevMsg.sender_id !== m.sender_id;
                        const isGroupEnd = !nextMsg || nextMsg.sender_id !== m.sender_id;
                        
                        const msgDate = new Date(m.created_at);
                        const prevMsgDate = prevMsg ? new Date(prevMsg.created_at) : null;
                        const showDateSeparator = !prevMsgDate || 
                          msgDate.toDateString() !== prevMsgDate.toDateString();

                        return (
                          <React.Fragment key={m.id || i}>
                            {showDateSeparator && (
                              <div className="messages-mobile-date-separator">
                                <span className="messages-mobile-date-pill">
                                  {msgDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                              </div>
                            )}
                            <motion.div 
                              initial={{ opacity: 0, y: 8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={cn(
                                "messages-mobile-msg-row",
                                isMe ? "messages-mobile-msg-row--me" : "messages-mobile-msg-row--other",
                                !isGroupStart ? "messages-mobile-msg-row--grouped" : ""
                              )}
                            >
                              <div className={cn(
                                "messages-mobile-msg-bubble-wrap",
                                isMe ? "messages-mobile-msg-bubble-wrap--me" : "messages-mobile-msg-bubble-wrap--other"
                              )}>
                                <div className={cn(
                                  "messages-mobile-msg-bubble",
                                  isMe 
                                    ? "messages-mobile-msg-bubble--me" 
                                    : "messages-mobile-msg-bubble--other",
                                  isMe 
                                    ? cn(isGroupEnd ? "messages-mobile-msg-bubble--me-end" : "") 
                                    : cn(isGroupEnd ? "messages-mobile-msg-bubble--other-end" : "")
                                )}>
                                  {m.contenu}
                                </div>
                                {isGroupEnd && (
                                  <div className={cn(
                                    "messages-mobile-msg-meta",
                                    isMe ? "messages-mobile-msg-meta--me" : "messages-mobile-msg-meta--other"
                                  )}>
                                    <span className="messages-mobile-msg-time">
                                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (
                                      <span className={m.status === 'read' ? "text-blue-400" : "text-slate-400 dark:text-white/20"}>
                                        {m.status === 'read' ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </React.Fragment>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Mobile Input */}
                  <div className="messages-mobile-input-area">
                    <form 
                      onSubmit={handleSend} 
                      className="messages-mobile-input-form"
                    >
                      <input 
                        type="text"
                        placeholder="Votre message..."
                        className="messages-mobile-input"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <motion.button 
                        whileTap={newMessage.trim() ? { scale: 0.9 } : {}}
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={cn(
                          "messages-mobile-send-btn",
                          newMessage.trim() 
                            ? "messages-mobile-send-btn--active" 
                            : "messages-mobile-send-btn--disabled"
                        )}
                      >
                        <Send className="w-[18px] h-[18px]" />
                      </motion.button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="messages-mobile-messages-empty" style={{ height: '100%' }}>
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── DESKTOP LAYOUT (unchanged) ──────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto h-[750px] bg-white dark:bg-black rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex overflow-hidden backdrop-blur-xl transition-all">
      
      {/* Sidebar - Liste des conversations */}
      <div className="w-80 border-r border-slate-200 dark:border-white/5 flex flex-col bg-slate-50/50 dark:bg-black/40">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl">
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-12 text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <MessageCircle className="w-6 h-6 text-slate-300" />
              </motion.div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vide</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {conversations.map((c, idx) => (
                <motion.div 
                  key={c.user?.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => { if (c.user?.id) setActiveChatUserId(c.user.id); }}
                  className={cn(
                    "mx-3 my-1 p-3 rounded-2xl cursor-pointer flex items-center gap-3 transition-all duration-300 relative group",
                    activeChatUserId === c.user?.id 
                      ? "bg-purple-600 shadow-xl shadow-purple-500/30" 
                      : "hover:bg-slate-200 dark:hover:bg-white/[0.03]"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border-2 transition-transform group-hover:scale-105",
                    activeChatUserId === c.user?.id ? "border-white/30" : "border-transparent dark:bg-white/5 bg-slate-200"
                  )}>
                    {c.user?.avatar_url ? (
                      <img src={c.user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className={cn("w-5 h-5", activeChatUserId === c.user?.id ? "text-white" : "text-slate-400")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("font-bold text-sm truncate", activeChatUserId === c.user?.id ? "text-white" : "text-slate-800 dark:text-slate-100")}>
                      {c.user?.first_name || "Utilisateur"} {c.user?.last_name || ""}
                    </div>
                    <div className={cn("text-xs truncate transition-opacity", activeChatUserId === c.user?.id ? "text-purple-100" : "text-slate-500 dark:text-slate-400")}>
                      {c.latest_message}
                    </div>
                  </div>
                  {activeChatUserId === c.user?.id && (
                    <motion.div layoutId="active-indicator" className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col bg-white dark:bg-black relative">
        <AnimatePresence mode="wait">
          {activeChatUserId && chatUser ? (
            <motion.div 
              key={activeChatUserId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              {/* Header du Chat */}
              <div 
                className="p-4 md:p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/70 dark:bg-black/40 backdrop-blur-xl z-20 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                onClick={() => onViewUser(activeChatUserId)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border-2 border-purple-500/10 shadow-lg shadow-purple-500/5",
                    chatUser.avatar_url ? "" : "bg-gradient-to-br from-purple-500/80 to-indigo-600/80"
                  )}>
                    {chatUser.avatar_url ? (
                      <img src={chatUser.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white leading-tight">
                       {chatUser.first_name} {chatUser.last_name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/5 dark:bg-black/20 custom-scrollbar">
                {messages.length === 0 && !loading && (
                   <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto opacity-50">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Messagerie sécurisée</p>
                     <p className="text-xs text-slate-500">Commencez l'échange avec {chatUser.first_name}.</p>
                   </div>
                )}
                
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => {
                    const isMe = m.sender_id === currentUserId;
                    const prevMsg = i > 0 ? messages[i-1] : null;
                    const nextMsg = i < messages.length - 1 ? messages[i+1] : null;
                    const isGroupStart = !prevMsg || prevMsg.sender_id !== m.sender_id;
                    const isGroupEnd = !nextMsg || nextMsg.sender_id !== m.sender_id;
                    
                    const msgDate = new Date(m.created_at);
                    const prevMsgDate = prevMsg ? new Date(prevMsg.created_at) : null;
                    const showDateSeparator = !prevMsgDate || 
                      msgDate.toDateString() !== prevMsgDate.toDateString();

                    return (
                      <React.Fragment key={m.id || i}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-10 first:mt-4 last:mb-6">
                            <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900/50 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] border border-slate-200 dark:border-white/5 backdrop-blur-sm">
                              {msgDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                        )}
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={cn(
                            "flex w-full group",
                            isMe ? "justify-end" : "justify-start",
                            !isGroupStart ? "-mt-4" : ""
                          )}
                        >
                          <div className={cn(
                            "max-w-[80%] flex flex-col",
                            isMe ? "items-end" : "items-start"
                          )}>
                            <div className={cn(
                              "px-5 py-3 text-[14px] leading-relaxed shadow-sm transition-all duration-300",
                              isMe 
                                ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:scale-[1.01]" 
                                : "bg-white dark:bg-white/[0.03] dark:text-white border border-slate-200 dark:border-white/[0.05] text-slate-800 backdrop-blur-sm",
                              isMe 
                                ? cn("rounded-[22px]", isGroupEnd ? "rounded-br-none" : "") 
                                : cn("rounded-[22px]", isGroupEnd ? "rounded-bl-none" : "")
                            )}>
                              {m.contenu}
                            </div>
                            {isGroupEnd && (
                              <div className="flex items-center gap-1.5 mt-1 px-2 opacity-60">
                                <span className="text-[9px] font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider">
                                  {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  <span className={m.status === 'read' ? "text-blue-400" : "text-slate-400 dark:text-white/20"}>
                                    {m.status === 'read' ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Elegant & Simple Chat Input Area */}
              <div className="px-6 py-5 bg-white/10 dark:bg-black/20 backdrop-blur-3xl border-t border-slate-200/20 dark:border-white/5 z-30">
                <form 
                  onSubmit={handleSend} 
                  className="flex items-center gap-2 bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200/30 dark:border-white/5 rounded-[28px] p-1.5 shadow-none"
                >
                  <input 
                    type="text"
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-none px-4 py-2.5 text-sm outline-none ring-0 appearance-none text-slate-800 dark:text-white dark:placeholder:text-slate-500 font-medium"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                  />
                  <motion.button 
                    whileHover={newMessage.trim() ? { scale: 1.05 } : {}}
                    whileTap={newMessage.trim() ? { scale: 0.95 } : {}}
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                      newMessage.trim() 
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                        : "bg-slate-300/50 dark:bg-white/5 text-slate-400 dark:text-white/10 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-12"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="w-24 h-24 bg-gradient-to-tr from-slate-100 to-white dark:from-white/5 dark:to-white/10 rounded-[32px] flex items-center justify-center border border-slate-200 dark:border-white/10 relative z-10 shadow-2xl">
                  <MessageCircle className="w-10 h-10 text-blue-500" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Votre messagerie</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Connectez-vous avec les autres membres et la gestion. Sélectionnez une discussion pour commencer.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}