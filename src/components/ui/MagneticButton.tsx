import React, { useRef, useState, MouseEvent } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  magneticStrength?: number;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function MagneticButton({ 
  children, 
  className, 
  magneticStrength = 0.2,
  ...props 
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * magneticStrength, y: middleY * magneticStrength });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      whileTap={{ scale: 0.95 }}
      className={cn("relative overflow-hidden", className)}
      {...props as any}
    >
      <motion.div 
        animate={{ x: x * 0.5, y: y * 0.5 }} 
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        className="flex items-center justify-center gap-2 w-full h-full"
      >
        {children}
      </motion.div>
    </motion.button>
  );
}
