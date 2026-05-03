'use client';

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, animate } from 'motion/react';
import { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import './Dock.css';

function DockItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseItemSize, customWidth }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val: any) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    // Center dynamically based on actual width
    return val - rect.x - rect.width / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  const expandedValue = useMotionValue(0);
  const prevCustomWidth = useRef(customWidth);

  useEffect(() => {
    if (customWidth) {
      prevCustomWidth.current = customWidth;
    }
    animate(expandedValue, customWidth ? 1 : 0, { type: "spring", stiffness: 350, damping: 28, mass: 0.8 });
  }, [customWidth, expandedValue]);

  const widthSize = useTransform(() => {
      const s = Number(size.get() || 0);
      const exp = Number(expandedValue.get() || 0);
      const targetW = customWidth ? Number(customWidth) : (prevCustomWidth.current ? Number(prevCustomWidth.current) : s);
      return (s * (1 - exp)) + (targetW * exp);
  });

  return (
    <motion.div
      ref={ref}
      style={{
        width: widthSize,
        height: size
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={cn(
        "dock-item",
        className,
        customWidth ? "cursor-default" : "cursor-pointer"
      )}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child: any) => cloneElement(child, { isHovered }))}
    </motion.div>
  );
}

function DockLabel({ children, className = '', ...rest }: any) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest: any) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && children && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = '' }: any) {
  return <div className={`dock-icon ${className} rounded-full`}>{children}</div>;
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50
}: any) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="dock-outer z-50">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`dock-panel ${className}`}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item: any, index: number) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            customWidth={item.customWidth}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
