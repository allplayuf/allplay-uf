import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReportModal from "../report/ReportModal";

export default function MatchPlayersModal({ isOpen, onClose, participants = [], matchId, matchTitle }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  if (!isOpen) return null;

  // Filter to only show players who checked in (or all if no check-ins)
  const checkedInPlayers = participants.filter(p => p.participantInfo?.checked_in);
  const displayPlayers = checkedInPlayers.length > 0 ? checkedInPlayers : participants;

  const handleReportPlayer = (player) => {
    setSelectedPlayer(player);
    setShowReportModal(true);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-2xl bg-[#121715] sm:rounded-2xl border-t sm:border border-[#223029] shadow-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#223029] flex-shrink-0">
              <div>
                <h2 className="font-semibold text-[#F4F7F5] text-lg">Matchens spelare</h2>
                <p className="text-xs text-[#7B8A83]">{matchTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-[#18221E] flex items-center justify-center text-[#7B8A83] hover:text-[#F4F7F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="px-4 py-3 bg-[#2BA84A]/10 border-b border-[#2BA84A]/20 flex-shrink-0">
              <p className="text-xs text-[#2BA84A] flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {checkedInPlayers.length > 0 
                  ? `${checkedInPlayers.length} spelare checkade in på plats`
                  : 'Endast anmälda spelare visas (ingen check-in data)'}
              </p>
            </div>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {displayPlayers.map((player) => {
                  const isCheckedIn = player.participantInfo?.checked_in;
                  
                  return (
                    <div
                      key={player.id}
                      className="bg-[#18221E] border border-[#223029] rounded-xl p-4 hover:border-[#2BA84A]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`${createPageUrl("Profile")}?userId=${player.id}`}
                          className="flex items-center gap-3 flex-1 group"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                            {player.avatar_url ? (
                              <img
                                src={player.avatar_url}
                                alt={player.display_name || player.full_name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <span className="text-white font-semibold text-lg">
                                {(player.display_name || player.full_name)?.[0] || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[#F4F7F5] text-sm truncate group-hover:text-[#2BA84A] transition-colors">
                              {player.display_name || player.full_name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-[#B6C2BC]">
                              <MapPin className="w-3 h-3" />
                              {player.city}
                            </div>
                            {isCheckedIn && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle className="w-3 h-3 text-[#2BA84A]" />
                                <span className="text-xs text-[#2BA84A] font-medium">Närvarande</span>
                              </div>
                            )}
                          </div>
                        </Link>

                        <button
                          onClick={() => handleReportPlayer(player)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium"
                        >
                          <Flag className="w-3 h-3" />
                          Rapportera
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-[#0F1513] rounded-lg p-2 text-center">
                          <div className="text-xs text-[#B6C2BC] mb-1">Matcher</div>
                          <div className="text-sm font-semibold text-[#F4F7F5]">{player.matches_played || 0}</div>
                        </div>
                        <div className="bg-[#0F1513] rounded-lg p-2 text-center">
                          <div className="text-xs text-[#B6C2BC] mb-1">MVPs</div>
                          <div className="text-sm font-semibold text-[#F4743B]">{player.mvp_count || 0}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#223029] flex-shrink-0">
              <Button
                onClick={onClose}
                className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-11"
              >
                Stäng
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Report Modal */}
      {selectedPlayer && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedPlayer(null);
          }}
          reportedUserId={selectedPlayer.id}
          reportedItemType="user"
          reportedItemId={selectedPlayer.id}
          itemTitle={selectedPlayer.display_name || selectedPlayer.full_name}
          matchId={matchId}
        />
      )}
    </>
  );
}