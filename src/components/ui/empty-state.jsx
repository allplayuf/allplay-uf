import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default' // 'default', 'compact', 'inline'
}) {
  const variants = {
    default: {
      container: "p-12 text-center",
      iconSize: "w-20 h-20",
      titleSize: "text-2xl",
      descSize: "text-base"
    },
    compact: {
      container: "p-8 text-center",
      iconSize: "w-16 h-16",
      titleSize: "text-xl",
      descSize: "text-sm"
    },
    inline: {
      container: "p-6 text-center",
      iconSize: "w-12 h-12",
      titleSize: "text-lg",
      descSize: "text-sm"
    }
  };

  const config = variants[variant] || variants.default;

  return (
    <Card className="bg-gradient-to-br from-[#121715] to-[#0F2917]/20 border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
      <CardContent className={config.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={`${config.iconSize} bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#2BA84A]/20`}>
            <Icon className={`${config.iconSize === 'w-20 h-20' ? 'w-10 h-10' : config.iconSize === 'w-16 h-16' ? 'w-8 h-8' : 'w-6 h-6'} text-[#2BA84A]`} />
          </div>
          <h3 className={`${config.titleSize} font-bold text-[#F4F7F5] mb-3`}>
            {title}
          </h3>
          <p className={`${config.descSize} text-[#B6C2BC] mb-6 max-w-md mx-auto`}>
            {description}
          </p>
          
          {(actionLabel || secondaryActionLabel) && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {actionLabel && (
                <Button
                  onClick={onAction}
                  className="bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] h-11 px-6 rounded-[14px] font-semibold"
                >
                  {actionLabel}
                </Button>
              )}
              {secondaryActionLabel && (
                <Button
                  onClick={onSecondaryAction}
                  variant="outline"
                  className="border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] h-11 px-6 rounded-[14px] font-semibold"
                >
                  {secondaryActionLabel}
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Preset empty states for common scenarios
export function NoMatchesFound({ onCreateMatch }) {
  return (
    <EmptyState
      icon={() => <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
      title="Inga matcher hittades"
      description="Det finns inga matcher som matchar dina filter just nu. Prova att justera dina filterinställningar eller skapa en ny match."
      actionLabel="Skapa match"
      onAction={onCreateMatch}
      secondaryActionLabel="Rensa filter"
      onSecondaryAction={() => window.location.reload()}
    />
  );
}

export function NoPlayersFound() {
  return (
    <EmptyState
      icon={() => <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
      title="Inga spelare hittades"
      description="Det finns inga spelare som matchar dina sökkriterier. Prova att ändra dina filter eller sök efter något annat."
      variant="compact"
    />
  );
}

export function NoTeamsFound({ onCreateTeam }) {
  return (
    <EmptyState
      icon={() => <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
      title="Inga lag hittades"
      description="Det finns inga lag i ditt område ännu. Var den första att skapa ett lag!"
      actionLabel="Skapa lag"
      onAction={onCreateTeam}
      variant="compact"
    />
  );
}