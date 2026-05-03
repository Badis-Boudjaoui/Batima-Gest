import React from "react";
import { cn } from "../../lib/utils";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "motion/react";

export default function TiltContainer({ children, className, variants, initial, whileHover, layoutId }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareOpacity = useMotionValue(0);

  // Utilisation de useMotionTemplate pour éviter le crash en production
  const background = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.3) 0%, transparent 80%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
    glareOpacity.set(0.12);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      variants={variants}
      initial={initial}
      whileHover={whileHover}
      layoutId={layoutId}
      className={cn("relative w-full h-full", className)}
      style={{ perspective: "1500px" }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        {/* Dynamic Glare Effect corrigé */}
        <motion.div
          style={{
            background,
            opacity: glareOpacity,
          }}
          className="absolute inset-0 pointer-events-none rounded-[28px] z-0"
        />

        <div
          style={{
            transform: "translateZ(40px)",
            transformStyle: "preserve-3d",
          }}
          className="w-full h-full"
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}