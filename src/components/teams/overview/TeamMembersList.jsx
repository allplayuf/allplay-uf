import React from "react";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import TeamMemberCard from "./TeamMemberCard";

export default function TeamMembersList({ members, pendingMembers = [], team, isLoading, isCaptainOrVice = false, onAccept, onRemove }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 bg-[#121715] border border-[#223029] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const viceIds = team?.vice_captain_ids || [];

  return (
    <div className="space-y-4">
      {/* Pending members section */}
      {isCaptainOrVice && pendingMembers.length > 0 && (
        <div>
          <h3 className="text-[12px] font-bold text-[#F59E0B] uppercase tracking-wider mb-2 px-1">
            Ansökningar ({pendingMembers.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingMembers.map((m, i) => (
              <TeamMemberCard
                key={m.id}
                member={m}
                isCaptain={false}
                isViceCaptain={false}
                index={i}
                isPending={true}
                isCaptainOrVice={isCaptainOrVice}
                onAccept={onAccept}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active members */}
      {members.length === 0 && pendingMembers.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-10 text-center">
          <Users className="w-10 h-10 text-[#9EAAA4] mx-auto mb-3" />
          <p className="text-[#B6C2BC] font-semibold">Inga medlemmar ännu</p>
        </Card>
      ) : (
        members.length > 0 && (
          <div>
            {pendingMembers.length > 0 && isCaptainOrVice && (
              <h3 className="text-[12px] font-bold text-[#9EAAA4] uppercase tracking-wider mb-2 px-1">
                Aktiva medlemmar ({members.length})
              </h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m, i) => (
                <TeamMemberCard
                  key={m.id}
                  member={m}
                  isCaptain={m.id === team?.captain_id}
                  isViceCaptain={viceIds.includes(m.id)}
                  index={i}
                  isPending={false}
                  isCaptainOrVice={isCaptainOrVice}
                  onRemove={isCaptainOrVice && m.id !== team?.captain_id ? onRemove : undefined}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
