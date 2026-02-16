import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";

/**
 * Shared header for admin sections: search + refresh + last updated timestamp
 */
export default function AdminSectionHeader({
  title,
  icon: Icon,
  iconColor = '#2BA84A',
  totalCount,
  filteredCount,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Sök...',
  isLoading,
  lastUpdated,
  onRefresh,
  children // extra filter controls
}) {
  const updatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5" style={{ color: iconColor }} />}
            <h3 className="font-semibold text-[#F4F7F5] text-lg">{title}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#7B8A83]">
            {updatedStr && <span>Uppdaterad {updatedStr}</span>}
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="h-8 border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] gap-1"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Uppdatera
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7B8A83] w-4 h-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl text-sm"
            />
          </div>
          {children}
        </div>

        <div className="text-xs text-[#7B8A83]">
          Visar <span className="text-[#F4F7F5] font-semibold">{filteredCount}</span> av {totalCount}
        </div>
      </CardContent>
    </Card>
  );
}