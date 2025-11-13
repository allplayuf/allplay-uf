import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function FilterSidebar({ filters, setFilters }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="bg-[#040F0F] rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 border-2 border-[#248232]">
      {/* Format Filter */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium text-[#FFFFFF]">Format</Label>
        <Select value={filters.format} onValueChange={(value) => handleFilterChange('format', value)}>
          <SelectTrigger className="bg-[#2D3A3A] border-2 border-[#248232] text-[#FFFFFF] text-xs sm:text-sm h-9 sm:h-10">
            <SelectValue placeholder="Välj format" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3A3A] border-2 border-[#248232]">
            <SelectItem value="all" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Alla format</SelectItem>
            <SelectItem value="5v5" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">5v5</SelectItem>
            <SelectItem value="7v7" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">7v7</SelectItem>
            <SelectItem value="11v11" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">11v11</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium text-[#FFFFFF]">Datum</Label>
        <Select value={filters.date} onValueChange={(value) => handleFilterChange('date', value)}>
          <SelectTrigger className="bg-[#2D3A3A] border-2 border-[#248232] text-[#FFFFFF] text-xs sm:text-sm h-9 sm:h-10">
            <SelectValue placeholder="Välj datum" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3A3A] border-2 border-[#248232]">
            <SelectItem value="all" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Alla dagar</SelectItem>
            <SelectItem value="today" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Idag</SelectItem>
            <SelectItem value="tomorrow" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Imorgon</SelectItem>
            <SelectItem value="week" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Denna vecka</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Skill Level Filter */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium text-[#FFFFFF]">Skicklighetsnivå</Label>
        <Select value={filters.skillLevel} onValueChange={(value) => handleFilterChange('skillLevel', value)}>
          <SelectTrigger className="bg-[#2D3A3A] border-2 border-[#248232] text-[#FFFFFF] text-xs sm:text-sm h-9 sm:h-10">
            <SelectValue placeholder="Välj nivå" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3A3A] border-2 border-[#248232]">
            <SelectItem value="all" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Alla nivåer</SelectItem>
            <SelectItem value="beginner" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Nybörjare (800-1000)</SelectItem>
            <SelectItem value="intermediate" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Fortsättare (1000-1200)</SelectItem>
            <SelectItem value="advanced" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Erfaren (1200-1400)</SelectItem>
            <SelectItem value="expert" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">Expert (1400+)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Distance Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs sm:text-sm font-medium text-[#FFFFFF]">Avstånd</Label>
          <span className="text-xs sm:text-sm text-[#2BA84A] font-bold">{filters.distance} km</span>
        </div>
        <Slider
          value={[filters.distance]}
          onValueChange={(value) => handleFilterChange('distance', value[0])}
          max={50}
          min={1}
          step={1}
          className="py-2"
        />
      </div>
    </div>
  );
}