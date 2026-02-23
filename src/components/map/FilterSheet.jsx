import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

export default function FilterSheet({ filters, onFilterChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-[#18221E]/80 border border-[#223029]/60 hover:bg-[#2BA84A]/15 hover:border-[#2BA84A]/25 text-[#F4F7F5] rounded-full transition-all font-semibold text-xs uppercase tracking-wide shadow-[0_0_8px_rgba(43,168,74,0.08)]">
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-[#121715] border-t border-[#223029] rounded-t-[20px] max-h-[80vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-[#F4F7F5] text-xl">Filtrera planer</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 pb-6">
          {/* Basic Filters - Always Visible */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#F4F7F5] mb-2 block">Matchformat</label>
              <Select 
                value={filters.format} 
                onValueChange={(value) => onFilterChange({ ...filters, format: value })}
              >
                <SelectTrigger className="w-full bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[14px] h-12">
                  <SelectValue placeholder="Välj format" />
                </SelectTrigger>
                <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                  <SelectItem value="all">Alla format</SelectItem>
                  <SelectItem value="5v5">5v5</SelectItem>
                  <SelectItem value="7v7">7v7</SelectItem>
                  <SelectItem value="11v11">11v11</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#F4F7F5] mb-2 block">
                Avstånd: {filters.distance}km
              </label>
              <Slider
                value={[filters.distance]}
                onValueChange={([value]) => onFilterChange({ ...filters, distance: value })}
                min={1}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#7B8A83] mt-1">
                <span>1km</span>
                <span>100km</span>
              </div>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-[#18221E] border border-[#223029] rounded-[14px] text-[#F4F7F5] hover:border-[#2BA84A]/30 transition-all"
          >
            <span className="text-sm font-medium">Avancerade filter</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Advanced Filters - Collapsible */}
          {showAdvanced && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div>
                <label className="text-sm font-semibold text-[#F4F7F5] mb-2 block">Datum</label>
                <Select 
                  value={filters.date} 
                  onValueChange={(value) => onFilterChange({ ...filters, date: value })}
                >
                  <SelectTrigger className="w-full bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[14px] h-12">
                    <SelectValue placeholder="Alla datum" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                    <SelectItem value="all">Alla datum</SelectItem>
                    <SelectItem value="today">Idag</SelectItem>
                    <SelectItem value="tomorrow">Imorgon</SelectItem>
                    <SelectItem value="week">Denna vecka</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#F4F7F5] mb-2 block">Spelarnivå</label>
                <Select 
                  value={filters.skillLevel} 
                  onValueChange={(value) => onFilterChange({ ...filters, skillLevel: value })}
                >
                  <SelectTrigger className="w-full bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[14px] h-12">
                    <SelectValue placeholder="Alla nivåer" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                    <SelectItem value="all">Alla nivåer</SelectItem>
                    <SelectItem value="beginner">Nybörjare</SelectItem>
                    <SelectItem value="intermediate">Medel</SelectItem>
                    <SelectItem value="advanced">Avancerad</SelectItem>
                    <SelectItem value="elite">Elit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#F4F7F5] mb-2 block">Sortera efter</label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => onFilterChange({ ...filters, sortBy: value })}
                >
                  <SelectTrigger className="w-full bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[14px] h-12">
                    <SelectValue placeholder="Sortera" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                    <SelectItem value="distance">Närmast</SelectItem>
                    <SelectItem value="matches">Mest bokade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="pt-4 border-t border-[#223029]">
            <Button
              onClick={() => onFilterChange({
                format: 'all',
                date: 'all',
                skillLevel: 'all',
                distance: 50,
                sortBy: 'distance'
              })}
              variant="outline"
              className="w-full border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] h-12 rounded-[14px] font-semibold"
            >
              Återställ filter
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}