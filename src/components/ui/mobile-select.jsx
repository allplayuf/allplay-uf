import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mobile-optimized Select using a branded Drawer on small screens.
 * Desktop falls back to regular Select.
 *
 * The drawer content uses z-[120] to render above the floating bottom nav (z-[100]).
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

      <DrawerContent
        className="z-[120] bg-[#0F1513] border-t border-white/5 rounded-t-[24px] shadow-[0_-24px_60px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-2">
          <h3 className="text-[17px] font-bold text-white tracking-tight">{label || placeholder}</h3>
        </div>

        {/* Options */}
        <div className="px-3 pb-6 space-y-1.5 max-h-[60vh] overflow-y-auto">
          {options.map(opt => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { onValueChange(opt.value); setOpen(false); }}
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
      </DrawerContent>
    </Drawer>
  );
}