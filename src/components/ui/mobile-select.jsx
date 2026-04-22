import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerOverlay, DrawerPortal } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mobile-optimized Select using a branded Drawer on small screens.
 * Desktop falls back to regular Select.
 *
 * The drawer is rendered at z-[120] so it sits above the floating bottom nav (z-[100]).
 */
export function MobileSelect({ value, onValueChange, options, placeholder, label, className }) {
  const [open, setOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const selectedOption = options.find(opt => opt.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder}>{selectedOption?.label || placeholder}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full flex items-center justify-between gap-2 bg-[#141917] border border-[#243029] text-[#F5F8F6] rounded-xl h-11 px-3 text-left hover:bg-[#18221E] transition-colors",
            className
          )}
        >
          <span className="truncate text-[14px] font-medium">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-[#8FA097] flex-shrink-0" />
        </button>
      </DrawerTrigger>

      {/* Custom portal with elevated z-index so drawer is above bottom nav (z-[100]) */}
      <DrawerPortal>
        <DrawerOverlay className="z-[115] bg-black/80 backdrop-blur-sm" />
        <div
          data-vaul-drawer=""
          className="fixed inset-x-0 bottom-0 z-[120] flex flex-col rounded-t-[24px] border-t border-white/5 bg-[#0F1513] shadow-[0_-24px_60px_rgba(0,0,0,0.6)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <DrawerContentInner title={label || placeholder} options={options} value={value} onValueChange={(v) => { onValueChange(v); setOpen(false); }} />
        </div>
      </DrawerPortal>
    </Drawer>
  );
}

function DrawerContentInner({ title, options, value, onValueChange }) {
  return (
    <>
      {/* Grab handle */}
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-[#243029]" />

      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-[17px] font-bold text-white tracking-tight">{title}</h3>
      </div>

      {/* Options */}
      <div className="px-3 pb-6 space-y-1.5 max-h-[60vh] overflow-y-auto">
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onValueChange(opt.value)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all",
                active
                  ? "bg-[#2BA84A]/18 ring-1 ring-[#2BA84A]/40 text-[#EAF6EE]"
                  : "bg-[#141917] hover:bg-[#18221E] text-[#C2CEC8] ring-1 ring-white/5"
              )}
            >
              <span className="font-semibold text-[15px]">{opt.label}</span>
              {active && (
                <div className="w-6 h-6 rounded-full bg-[#2BA84A] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}