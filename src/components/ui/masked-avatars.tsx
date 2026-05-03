import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Avatar {
  avatar?: string;
  avatar_url?: string;
  name?: string;
  first_name?: string;
}

interface MaskedAvatarsProps {
  avatars: Avatar[];
  className?: string;
}

export function MaskedAvatars({ avatars, className }: MaskedAvatarsProps) {
  const displayAvatars = avatars.slice(0, 5);
  const remainingCount = avatars.length - 5;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("flex flex-row items-center justify-start py-2", className)}>
      {displayAvatars.map((user, idx) => {
        const imageUrl = user.avatar || user.avatar_url;
        const displayName = user.name || user.first_name || "?";
        
        return (
          <div 
            key={idx} 
            className="group relative -ml-3 first:ml-0 hover:z-50"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: "spring", stiffness: 260, damping: 15 },
                  }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute -top-10 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap ring-1 ring-white/20"
                >
                  {displayName}
                  {/* Petit triangle pointeur en bas du tooltip */}
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900 border-r border-b border-white/20" />
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div 
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 shrink-0 shadow-md"
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={displayName} 
                  className="h-full w-full object-cover rounded-full" 
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 font-bold text-xs uppercase rounded-full">
                  {displayName.charAt(0)}
                </div>
              )}
            </motion.div>
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <div className="relative -ml-3 hover:z-50">
          <motion.div 
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0 shadow-md"
          >
            +{remainingCount}
          </motion.div>
        </div>
      )}
    </div>
  );
}
