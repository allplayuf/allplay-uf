import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Users, BarChart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * CupAdminTabs - Admin interface specifically for CUP_ADMIN role
 * Only shows cup-related management tools
 */
export default function CupAdminTabs({ user }) {
  return (
    <div className="min-h-screen bg-[#0F1513] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-[#F59E0B]" />
            <h1 className="text-3xl lg:text-4xl font-bold text-[#FFFFFF]">Cup Administration</h1>
          </div>
          <p className="text-[#FFFFFF]/70 text-lg">Hantera cuper, matcher och deltagare</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to={createPageUrl("CreateCup")}>
            <Card className="bg-[#121715] border border-[#223029] hover:border-[#F59E0B] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center ring-1 ring-[#F59E0B]/30">
                    <Trophy className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F4F7F5]">Skapa Cup</h3>
                    <p className="text-xs text-[#B6C2BC]">Ny turnering</p>
                  </div>
                </div>
                <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl h-11">
                  Skapa Cup
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Cups")}>
            <Card className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/30">
                    <Calendar className="w-6 h-6 text-[#2BA84A]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F4F7F5]">Hantera Cuper</h3>
                    <p className="text-xs text-[#B6C2BC]">Se alla turneringar</p>
                  </div>
                </div>
                <Button className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-11">
                  Visa Cuper
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("AdminCleanup")}>
            <Card className="bg-[#121715] border border-[#223029] hover:border-[#9370DB] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#9370DB]/20 rounded-xl flex items-center justify-center ring-1 ring-[#9370DB]/30">
                    <BarChart className="w-6 h-6 text-[#9370DB]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F4F7F5]">Cup Cleanup</h3>
                    <p className="text-xs text-[#B6C2BC]">Rensa gamla cuper</p>
                  </div>
                </div>
                <Button className="w-full bg-[#9370DB] hover:bg-[#8B008B] text-white rounded-xl h-11">
                  Öppna Cleanup
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Info Message */}
        <Card className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-[#F59E0B]">
              <strong>CUP Administrator:</strong> Du har behörighet att hantera cuper, turneringar och relaterade matcher. För övriga admin-funktioner, kontakta en systemadministratör.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}