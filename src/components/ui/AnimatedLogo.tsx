import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface AnimatedLogoProps {
  className?: string;
  size?: number;
  loop?: boolean;
}

export default function AnimatedLogo({ className, size = 40, loop = false }: AnimatedLogoProps) {
  // Synchronized looping animations mapping
  const animProps = {
    b1: loop 
      ? { animate: { scaleY: [0, 0, 1, 1, 0] }, transition: { duration: 3, repeat: Infinity, times: [0, 0.1, 0.25, 0.8, 1], ease: ["linear", "easeOut", "linear", "easeIn"] }, initial: { scaleY: 0 } }
      : { animate: { scaleY: 1 }, transition: { duration: 0.5, delay: 0.1, type: "spring" }, initial: { scaleY: 0 } },
      
    b2: loop 
      ? { animate: { scaleY: [0, 0, 1, 1, 0] }, transition: { duration: 3, repeat: Infinity, times: [0, 0.2, 0.35, 0.8, 1], ease: ["linear", "easeOut", "linear", "easeIn"] }, initial: { scaleY: 0 } }
      : { animate: { scaleY: 1 }, transition: { duration: 0.5, delay: 0.2, type: "spring" }, initial: { scaleY: 0 } },
      
    b3: loop 
      ? { animate: { scaleY: [0, 0, 1, 1, 0] }, transition: { duration: 3, repeat: Infinity, times: [0, 0.3, 0.45, 0.8, 1], ease: ["linear", "easeOut", "linear", "easeIn"] }, initial: { scaleY: 0 } }
      : { animate: { scaleY: 1 }, transition: { duration: 0.5, delay: 0.3, type: "spring" }, initial: { scaleY: 0 } },

    path: loop
      ? { animate: { pathLength: [0, 0, 1, 1, 0] }, transition: { duration: 3, repeat: Infinity, times: [0, 0.4, 0.7, 0.85, 1], ease: ["linear", "easeOut", "linear", "easeIn"] }, initial: { pathLength: 0 } }
      : { animate: { pathLength: 1 }, transition: { duration: 0.8, delay: 0.5, ease: "easeOut" }, initial: { pathLength: 0 } },

    circle: loop
      ? { animate: { r: [0, 0, 3.5, 2.5, 2.5, 0], opacity: [0, 0, 1, 1, 1, 0] }, transition: { duration: 3, repeat: Infinity, times: [0, 0.7, 0.75, 0.8, 0.85, 1], ease: ["linear", "easeOut", "easeIn", "linear", "easeIn"] }, initial: { r: 0, opacity: 0 } }
      : { animate: { r: [0, 3.5, 2.5], opacity: [0, 1, 0.6] }, transition: { duration: 0.5, delay: 1.3 }, initial: { r: 0, opacity: 0 } }
  };

  return (
    <div className={cn("relative flex items-center justify-center filter drop-shadow hover:drop-shadow-lg transition-all group", className)}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.rect x="4" y="20" width="9" height="16" rx="3" fill="url(#logo_g1)" style={{ originY: 1 }}
          {...animProps.b1}
        />
        <motion.rect x="15" y="10" width="9" height="26" rx="3" fill="url(#logo_g2)" style={{ originY: 1 }}
          {...animProps.b2}
        />
        <motion.rect x="26" y="4" width="9" height="32" rx="3" fill="url(#logo_g3)" style={{ originY: 1 }}
          {...animProps.b3}
        />
        
        <motion.path 
          d="M 2 24 C 15 28, 25 12, 38 6" 
          stroke="url(#logo_g4)" strokeWidth="3.5" strokeLinecap="round" opacity="0.95" fill="none"
          {...animProps.path}
        />

        {/* Pulsing glow point at the end of the line */}
        <motion.circle 
          cx="38" cy="6" fill="#FDE047"
          style={{ originX: "38px", originY: "6px" }}
          {...animProps.circle}
        />
        <defs>
          <linearGradient id="logo_g1" x1="8.5" y1="20" x2="8.5" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A855F7" />
            <stop offset="1" stopColor="#7E22CE" />
          </linearGradient>
          <linearGradient id="logo_g2" x1="19.5" y1="10" x2="19.5" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#4338CA" />
          </linearGradient>
          <linearGradient id="logo_g3" x1="30.5" y1="4" x2="30.5" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="logo_g4" x1="2" y1="24" x2="38" y2="6" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F472B6" />
            <stop offset="1" stopColor="#FDE047" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
