import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/i18n/LanguageProvider";

export default function FilterSidebar({ filters, setFilters }) {
  const { t } = useT();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-[#040F0F] rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 border-2 border-[#248232]">
      {/* Format Filter */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium text-[#FFFFFF]">{t('filter.label_format')}</Label>
        <Select value={filters.format} onValueChange={(value) => handleFilterChange('format', value)}>
          <SelectTrigger className="bg-[#2D3A3A] border-2 border-[#248232] text-[#FFFFFF] text-xs sm:text-sm h-9 sm:h-10">
            <SelectValue placeholder={t('filter.pick_format')} />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3A3A] border-2 border-[#248232]">
            <SelectItem value="all" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('filter.all_formats')}</SelectItem>
            <SelectItem value="5v5" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">5v5</SelectItem>
            <SelectItem value="7v7" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">7v7</SelectItem>
            <SelectItem value="11v11" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">11v11</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium text-[#FFFFFF]">{t('filter.label_date')}</Label>
        <Select value={filters.date} onValueChange={(value) => handleFilterChange('date', value)}>
          <SelectTrigger className="bg-[#2D3A3A] border-2 border-[#248232] text-[#FFFFFF] text-xs sm:text-sm h-9 sm:h-10">
            <SelectValue placeholder={t('filter.pick_date')} />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3A3A] border-2 border-[#248232]">
            <SelectItem value="all" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('filter.all_days')}</SelectItem>
            <SelectItem value="today" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('common.today')}</SelectItem>
            <SelectItem value="tomorrow" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('common.tomorrow')}</SelectItem>
            <SelectItem value="week" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('filter.date_week')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Skill Level Filter */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium text-[#FFFFFF]">{t('filter.label_skill')}</Label>
        <Select value={filters.skillLevel} onValueChange={(value) => handleFilterChange('skillLevel', value)}>
          <SelectTrigger className="bg-[#2D3A3A] border-2 border-[#248232] text-[#FFFFFF] text-xs sm:text-sm h-9 sm:h-10">
            <SelectValue placeholder={t('filter.pick_level')} />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3A3A] border-2 border-[#248232]">
            <SelectItem value="all" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('filter.all_levels')}</SelectItem>
            <SelectItem value="beginner" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('filter.level_beginner')}</SelectItem>
            <SelectItem value="intermediate" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('filter.level_intermediate')}</SelectItem>
            <SelectItem value="advanced" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('filter.level_advanced')}</SelectItem>
            <SelectItem value="expert" className="text-[#FFFFFF] focus:bg-[#2BA84A] focus:text-[#FFFFFF] text-xs sm:text-sm">{t('filter.level_expert')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Distance Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs sm:text-sm font-medium text-[#FFFFFF]">{t('filter.label_distance')}</Label>
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