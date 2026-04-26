import React from 'react';
import { ChevronRight, Plus, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

function cleanName(name) {
  if (!name) return '';
  return name.replace(/^.+?–\s*/, '').trim() || name;
}

export default function SubPitchGrid({ subPitches, matchesByPitch, onSelect }) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-[#9EAAA4] mb-3">
        Tryck på en plan för att skapa en match där.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {subPitches.map((sub, i) => {
          const matchCount = (matchesByPitch.get(sub.id) || []).length;
          const isActive = matchCount > 0;
          return (
            <motion.button
              key={sub.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              onClick={() => onSelect(sub)}
              className={`text-left p-3 rounded-2xl border transition-all group active:scale-[0.98] ${
                isActive
                  ? 'bg-[#2BA84A]/10 border-[#2BA84A]/35 hover:border-[#2BA84A]/55 hover:bg-[#2BA84A]/15'
                  : 'bg-[#18221E] border-[#223029] hover:border-[#2BA84A]/40 hover:bg-[#1E2724]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-[#F4F7F5] truncate leading-tight">
                    {cleanName(sub.name)}
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1 mt-1">
                      <Activity className="w-3 h-3 text-[#86EFAC]" />
                      <span className="text-[10px] font-bold text-[#86EFAC]">
                        {matchCount} pågår
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#0F1513] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2BA84A] transition-colors">
                  <Plus className="w-3.5 h-3.5 text-[#7B8A83] group-hover:text-white transition-colors" />
                </div>
              </div>

              {sub.formats_supported?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {sub.formats_supported.map(f => (
                    <span
                      key={f}
                      className="inline-flex h-[20px] items-center rounded-md px-1.5 text-[10px] font-bold bg-[#0F1513] text-[#B6C2BC] ring-1 ring-[#223029]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}