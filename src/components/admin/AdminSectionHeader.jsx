import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, X } from "lucide-react";

/**
 * Shared header for admin sections: icon + title + count, search + extras, refresh.
 * Redesigned to feel lighter and more premium — no nested Card, less visual weight.
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
  children, // extra filter controls (selects etc.)
}) {
  const updatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    : null;

  const hasSearch = typeof onSearchChange === 'function';

  return (
    <div className="space-y-3">
      {/* Row 1: title + meta + refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `${iconColor}22`,
                boxShadow: `inset 0 0 0 1px ${iconColor}33`,
              }}
            >
              <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-[#F4F7F5] text-[17px] leading-tight truncate">{title}</h3>
            <div className="text-[11px] text-[#7B8A83] leading-tight mt-0.5 tabular-nums">
              {filteredCount != null && totalCount != null ? (
                <>Visar <span className="text-[#B6C2BC] font-semibold">{filteredCount}</span> av {totalCount}</>
              ) : totalCount != null ? (
                <>{totalCount} totalt</>
              ) : null}
              {updatedStr && (
                <span className="text-[#4B5A53] ml-2">• uppdaterad {updatedStr}</span>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="h-9 w-9 sm:w-auto sm:px-3 p-0 sm:gap-1.5 border-[#223029] bg-[#121715] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] rounded-xl flex-shrink-0"
          disabled={isLoading}
          aria-label="Uppdatera"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-xs">Uppdatera</span>
        </Button>
      </div>

      {/* Row 2: search + filters */}
      {(hasSearch || children) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {hasSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7B8A83] w-4 h-4 pointer-events-none" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-9 h-10 bg-[#121715] border-[#223029] text-[#F4F7F5] rounded-xl text-sm placeholder:text-[#5B6A63]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]"
                  aria-label="Rensa sökning"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {children && <div className="flex gap-2 flex-wrap">{children}</div>}
        </div>
      )}
    </div>
  );
}