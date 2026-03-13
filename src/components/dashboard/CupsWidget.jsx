import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, MapPin, Calendar, Users, ArrowRight, Sparkles, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

// Shared query key for cups across platform
export const CUPS_QUERY_KEY = ['cups-list'];

const STATUS_CONFIG = {
  'registration_open': { 
    label: 'Anmälan öppen', 
    color: '#2BA84A',
    bgColor: 'bg-[#2BA84A]/16',
    textColor: 'text-[#2BA84A]',
    borderColor: 'border-[#2BA84A]/30'
  },
  'upcoming': { 
    label: 'Kommande', 
    color: '#F59E0B',
    bgColor: 'bg-[#F59E0B]/16',
    textColor: 'text-[#FCD34D]',
    borderColor: 'border-[#F59E0B]/30'
  },
  'ongoing': { 
    label: 'Pågår nu', 
    color: '#DC2626',
    bgColor: 'bg-[#DC2626]/16',
    textColor: 'text-[#FCA5A5]',
    borderColor: 'border-[#DC2626]/30'
  },
};

export default function CupsWidget() {
  // Use shared query key for platform-wide sync
  const { data: cups = [], isLoading } = useQuery({
    queryKey: CUPS_QUERY_KEY,
    queryFn: async () => {
      const allCups = await base44.entities.Cup.list('-created_date');
      const today = new Date().toISOString().split('T')[0];
      
      return allCups
        .filter(cup => {
          if (cup.is_public === false) return false;
          // NEVER show completed cups on dashboard
          if (cup.status === 'completed') return false;
          // Only show cups whose start_date hasn't passed yet, or are currently ongoing
          if (cup.status === 'ongoing') return true;
          if (cup.start_date && cup.start_date < today && cup.status !== 'ongoing') return false;
          return cup.status === 'registration_open' || cup.status === 'upcoming';
        })
        .sort((a, b) => {
          const statusOrder = { ongoing: 0, registration_open: 1, upcoming: 2 };
          return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
        })
        .slice(0, 3);
    },
    staleTime: 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="bg-[#121715] rounded-[16px] sm:rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">Cuper</h3>
          </div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-[#18221E] rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render anything if no upcoming/active cups
  if (cups.length === 0) {
    return null;
  }

  return (
    <Card className="bg-[#121715] rounded-[16px] sm:rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">Aktiva Cuper</h3>
          </div>
          <Link 
            to={createPageUrl("Community") + "?tab=cups"} 
            className="text-[12px] leading-[18px] font-medium text-[#F59E0B] hover:text-[#FCD34D] flex items-center gap-1 transition-colors"
          >
            Visa alla
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {cups.map((cup, index) => {
            const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
            const progress = cup.max_participants > 0 
              ? (cup.current_participants / cup.max_participants) * 100 
              : 0;
            const isHot = progress >= 75;

            return (
              <motion.div
                key={cup.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`${createPageUrl("CupDetail")}?cup_id=${cup.id}`}>
                  <div className="bg-[#18221E] rounded-xl border border-[#223029] p-3 hover:border-[#F59E0B]/30 hover:bg-[#1A1E1B] transition-all group">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-[#F4F7F5] truncate group-hover:text-[#F59E0B] transition-colors">
                            {cup.name}
                          </h4>
                          {isHot && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Sparkles className="w-3 h-3 text-[#F59E0B] flex-shrink-0" />
                            </motion.div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#B6C2BC]">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{cup.location}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusConfig.bgColor} ${statusConfig.textColor} flex-shrink-0`}>
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-3 text-xs text-[#B6C2BC] mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(cup.start_date).toLocaleDateString('sv-SE', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {cup.current_participants}/{cup.max_participants}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        cup.format === '5v5' ? 'bg-[#2BA84A]/16 text-[#2BA84A]' :
                        cup.format === '7v7' ? 'bg-[#4169E1]/16 text-[#B0C4DE]' :
                        'bg-[#9370DB]/16 text-[#DDD6FE]'
                      }`}>
                        {cup.format}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#B6C2BC]">
                        <span>Anmälningar</span>
                        <span className="font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#0F1513] rounded-full overflow-hidden border border-[#223029]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            isHot 
                              ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706]' 
                              : 'bg-gradient-to-r from-[#F59E0B] to-[#EAB308]'
                          }`}
                          style={{
                            boxShadow: isHot ? '0 0 10px rgba(245, 158, 11, 0.6)' : '0 0 8px rgba(245, 158, 11, 0.4)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Link */}
        <Link to={createPageUrl("Community") + "?tab=cups"}>
          <button className="w-full mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#F59E0B]/16 px-4 text-xs font-semibold text-[#FCD34D] ring-1 ring-[#F59E0B]/30 transition-all hover:bg-[#F59E0B]/24 hover:ring-[#F59E0B]/45">
            <Trophy className="w-3.5 h-3.5" />
            Se alla turneringar
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}