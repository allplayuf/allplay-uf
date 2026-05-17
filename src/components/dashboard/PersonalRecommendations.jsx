import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Trophy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useT } from "@/i18n/LanguageProvider";

export default function PersonalRecommendations({ players = [], teams = [], matches = [] }) {
  const { t } = useT();
  const hasRecommendations = players.length > 0 || teams.length > 0 || matches.length > 0;

  if (!hasRecommendations) return null;

  return (
    <Card className="bg-gradient-to-br from-[#121715] to-[#18221E]/50 rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#9370DB]/20 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#9370DB]/10 to-[#7C3AED]/10 p-5 border-b border-[#9370DB]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#9370DB]/20 rounded-xl flex items-center justify-center ring-2 ring-[#9370DB]/30">
              <Sparkles className="w-5 h-5 text-[#9370DB]" strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold text-[#F4F7F5]">{t('recs.title')}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Players */}
          {players.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#F4F7F5] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#9370DB]" />
                  {t('recs.players')}
                </h4>
                <Link to={createPageUrl("Community")} className="text-xs font-semibold text-[#9370DB] hover:text-[#DDD6FE]">
                  {t('common.see_all')}
                </Link>
              </div>
              <div className="space-y-2">
                {players.slice(0, 3).map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`${createPageUrl("Profile")}?userId=${player.id}`}>
                      <div className="flex items-center gap-3 p-3 bg-[#18221E] rounded-xl hover:bg-[#223029] transition-colors border border-[#223029]">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#9370DB] to-[#7C3AED] rounded-xl flex items-center justify-center flex-shrink-0">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt={player.full_name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-white font-semibold text-sm">{player.full_name?.[0] || 'U'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#F4F7F5] truncate">{player.display_name || player.full_name}</p>
                          <p className="text-xs text-[#B6C2BC]">{t('match_history.count', { n: player.matches_played || 0 })}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Teams */}
          {teams.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#F4F7F5] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#9370DB]" />
                  {t('recs.teams')}
                </h4>
                <Link to={createPageUrl("Community")} className="text-xs font-semibold text-[#9370DB] hover:text-[#DDD6FE]">
                  {t('common.see_all')}
                </Link>
              </div>
              <div className="space-y-2">
                {teams.slice(0, 2).map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`${createPageUrl("TeamOverview")}?teamId=${team.id}`}>
                      <div className="flex items-center gap-3 p-3 bg-[#18221E] rounded-xl hover:bg-[#223029] transition-colors border border-[#223029]">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: team.teamColor || '#2BA84A' }}>
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-white font-bold text-sm">{team.name?.[0] || 'T'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#F4F7F5] truncate">{team.name}</p>
                          <p className="text-xs text-[#B6C2BC]">{t('recs.members', { n: team.current_members || 0 })}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Matches */}
          {matches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#F4F7F5] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#9370DB]" />
                  {t('recs.matches')}
                </h4>
                <Link to={createPageUrl("Matches")} className="text-xs font-semibold text-[#9370DB] hover:text-[#DDD6FE]">
                  {t('common.see_all')}
                </Link>
              </div>
              <div className="space-y-2">
                {matches.slice(0, 2).map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                      <div className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl hover:bg-[#223029] transition-colors border border-[#223029]">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#F4F7F5] truncate">{match.title}</p>
                          <p className="text-xs text-[#B6C2BC]">{match.date} • {match.format}</p>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <span className="inline-flex h-7 items-center rounded-full bg-[#9370DB]/18 px-3 text-xs font-bold text-[#DDD6FE] ring-1 ring-[#9370DB]/25">
                            {match.current_players || 0}/{match.max_players}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}