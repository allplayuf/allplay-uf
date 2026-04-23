import React from "react";
import { Card } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import TeamMemberCard from "./TeamMemberCard";

export default function TeamMembersList({ members, team, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#2BA84A] animate-spin" />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-2xl p-10 text-center">
        <Users className="w-10 h-10 text-[#9EAAA4] mx-auto mb-3" />
        <p className="text-[#B6C2BC] font-semibold">Inga medlemmar hittades</p>
      </Card>
    );
  }

  const viceIds = team?.vice_captain_ids || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {members.map((m, index) => (
        <TeamMemberCard
          key={m.id}
          member={m}
          isCaptain={m.id === team?.captain_id}
          isViceCaptain={viceIds.includes(m.id)}
          index={index}
        />
      ))}
    </div>
  );
}