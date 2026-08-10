"use client";

import { useState, useRef, useEffect } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  /** Position of the tooltip relative to the trigger. Default is 'top' (above trigger). */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Alignment of the tooltip. Default is 'start' (left-aligned). */
  align?: 'start' | 'center' | 'end';
  /** Custom alignment classes, overrides the default align prop. (Ignored in Radix implementation) */
  alignClassName?: string;
  /** Width of the tooltip content box. E.g. 'w-64', 'w-48'. */
  width?: string;
  /** Extra classes for the content box itself. */
  contentClassName?: string;
  /** Extra inline styles for the content box itself. */
  contentStyle?: React.CSSProperties;
  /** Gap bridging padding class. e.g., 'pb-1' if position is top. (Ignored in Radix implementation) */
  gapClass?: string;
  /** Classes for the wrapper element. */
  triggerClassName?: string;
  /** Disables the tooltip entirely */
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  position = 'top',
  align = 'start',
  width = 'w-max max-w-xs',
  contentClassName = 'p-3 bg-white border-2 border-primary text-black text-[11px] rounded-xl shadow-xl',
  triggerClassName = 'group relative inline-flex items-center',
  disabled = false,
  contentStyle,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  if (disabled) return <>{children}</>;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 300); // 300ms subtle entry delay
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 300); // 300ms subtle exit delay
  };

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          <div 
            className={cn(triggerClassName)}
            onClick={() => setOpen(!open)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {children}
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={position}
            align={align}
            sideOffset={8}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              "z-9999",
              "animate-in fade-in-0 duration-200 ease-out",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
              "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
              "data-[side=bottom]:data-[state=closed]:slide-out-to-top-2 data-[side=top]:data-[state=closed]:slide-out-to-bottom-2",
              "data-[side=left]:data-[state=closed]:slide-out-to-right-2 data-[side=right]:data-[state=closed]:slide-out-to-left-2",
              width
            )}
            onPointerDownOutside={() => setOpen(false)}
          >
            <div className={contentClassName} style={contentStyle}>
              {content}
            </div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
