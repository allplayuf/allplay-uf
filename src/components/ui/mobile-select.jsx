import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check } from 'lucide-react';

/**
 * Mobile-optimized Select using Drawer on small screens
 * Falls back to regular Select on desktop
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
        <button className={className}>
          {selectedOption?.label || placeholder}
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{label || placeholder}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-2">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onValueChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                value === opt.value
                  ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                  : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029]'
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {value === opt.value && <Check className="w-5 h-5 text-[#2BA84A]" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}