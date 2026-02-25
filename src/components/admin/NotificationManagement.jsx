import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Construction } from "lucide-react";

/**
 * NotificationManagement — placeholder
 * 
 * AdminNotification table does not exist in Supabase yet.
 * This component shows a "coming soon" message instead of crashing.
 */
export default function NotificationManagement() {
  return (
    <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
      <CardHeader className="border-b border-[#223029] pb-4">
        <CardTitle className="text-[#F4F7F5] text-xl flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#F59E0B]" />
          Dashboard-notiser
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#F59E0B]/20">
          <Construction className="w-8 h-8 text-[#F59E0B]" />
        </div>
        <h3 className="font-semibold text-[#F4F7F5] mb-2 text-lg">Kommer snart</h3>
        <p className="text-sm text-[#B6C2BC] max-w-sm mx-auto">
          Hantering av dashboard-notiser migreras till Supabase. Funktionen är tillfälligt inaktiverad.
        </p>
      </CardContent>
    </Card>
  );
}