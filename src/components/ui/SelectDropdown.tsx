"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectDropdownProps<T extends string = string> {
  options: SelectOption<T>[] | readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function SelectDropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  className,
  buttonClassName,
  menuClassName,
  align = 'right',
  disabled = false,
  size = 'md',
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-flex items-center gap-2", className)}>
      {label && (
        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap hidden sm:inline">
          {label}
        </span>
      )}

      <div className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            "w-full rounded-full border border-border-default bg-surface-primary text-text-primary font-medium flex items-center justify-between gap-2 transition-all select-none hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary/20",
            size === 'sm' ? "h-8 px-3 text-xs" : "h-9 sm:h-10 px-3.5 text-xs sm:text-[13px]",
            disabled && "opacity-50 cursor-not-allowed",
            isOpen && "border-primary/60 ring-2 ring-primary/10",
            buttonClassName
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            {selectedOption?.icon && (
              <span className="shrink-0">{selectedOption.icon}</span>
            )}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <ChevronDown
            size={14}
            className={cn(
              "text-text-muted transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-text-primary"
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-[calc(100%+6px)] z-40 min-w-[170px] bg-surface-elevated border border-border-default rounded-2xl shadow-elevated p-1.5 max-h-60 overflow-y-auto custom-scrollbar",
                align === 'right' ? "right-0" : "left-0",
                menuClassName
              )}
              role="listbox"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-xs sm:text-[13px] font-medium flex items-center justify-between gap-2 transition-colors select-none",
                      isSelected
                        ? "bg-primary/15 text-text-primary font-semibold"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-primary shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
