import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock, Users } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/components/utils/helpers";
import { base44 } from "@/api/base44Client";

export default function TeamCalendar({ team }) {
  const [date, setDate] = useState(new Date());
  const [matches, setMatches] = useState([]);
  const [selectedDateMatches, setSelectedDateMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadTeamMatches();
  }, [team.id]);

  useEffect(() => {
    if (date) {
      const matchesOnDate = matches.filter(m => {
        if (!m.date) return false;
        return isSameDay(parseISO(m.date), date);
      });
      setSelectedDateMatches(matchesOnDate);
    }
  }, [date, matches]);

  const loadTeamMatches = async () => {
    try {
      // Fetch matches where team is A or B
      // Note: Since we can't do OR query easily in one go, we might fetch list and filter 
      // or do two queries. For calendar, we usually need a range, but let's fetch recent/upcoming.
      // Filter allows specific fields.
      
      const matchesA = await base44.entities.Match.filter({ team_a_id: team.id });
      const matchesB = await base44.entities.Match.filter({ team_b_id: team.id });
      
      // Combine and dedup
      const allMatches = [...matchesA, ...matchesB];
      const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());
      
      setMatches(uniqueMatches);
    } catch (error) {
      console.error("Error loading team matches:", error);
    }
  };

  // Create modifiers for the calendar to highlight days with matches
  const matchDays = matches.map(m => parseISO(m.date));
  
  const modifiers = {
    hasMatch: matchDays
  };

  const modifiersStyles = {
    hasMatch: {
      color: 'white',
      backgroundColor: '#2BA84A',
      fontWeight: 'bold'
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Calendar Section */}
      <div className="md:col-span-5 lg:col-span-4">
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px] overflow-hidden h-full">
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={sv}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border border-[#223029] bg-[#18221E] text-[#F4F7F5]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Matches List Section */}
      <div className="md:col-span-7 lg:col-span-8">
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px] h-full min-h-[400px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#2BA84A]" />
              {date ? format(date, 'd MMMM yyyy', { locale: sv }) : 'Välj datum'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {selectedDateMatches.length > 0 ? (
              <div className="space-y-4">
                {selectedDateMatches.map(match => (
                  <div 
                    key={match.id}
                    onClick={() => navigate(`${createPageUrl('MatchDetail')}?id=${match.id}`)}
                    className="bg-[#18221E] border border-[#223029] rounded-xl p-4 hover:border-[#2BA84A]/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${
                        match.status === 'upcoming' ? 'bg-[#4169E1] text-white' :
                        match.status === 'completed' ? 'bg-[#6B7280] text-white' :
                        'bg-[#F59E0B] text-black'
                      }`}>
                        {match.status === 'upcoming' ? 'Kommande' : 
                         match.status === 'completed' ? 'Avslutad' : 
                         match.status === 'ongoing' ? 'Pågår' : match.status}
                      </Badge>
                      <span className="text-[#B6C2BC] text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {match.time}
                      </span>
                    </div>
                    
                    <h4 className="text-[#F4F7F5] font-semibold text-lg mb-2 group-hover:text-[#2BA84A] transition-colors">
                      {match.title}
                    </h4>
                    
                    <div className="flex items-center gap-4 text-sm text-[#B6C2BC]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {match.format}
                      </div>
                      {match.venue_id && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[150px]">Plan {match.venue_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-[#223029] mx-auto mb-3" />
                <h3 className="text-[#F4F7F5] font-medium mb-1">Inga matcher</h3>
                <p className="text-[#B6C2BC] text-sm">Det finns inga matcher inplanerade för detta datum.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}