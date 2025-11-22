import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function UpcomingMatches({ matches }) {
  const formatMatchTime = (date, time) => {
    try {
      const matchDate = new Date(`${date}T${time}`);
      return format(matchDate, 'EEE d MMM, HH:mm', { locale: sv });
    } catch {
      return `${date} ${time}`;
    }
  };

  const getFormatColor = (format) => {
    switch (format) {
      case '5v5': return 'bg-blue-100 text-blue-800 border-blue-200';
      case '7v7': return 'bg-green-100 text-green-800 border-green-200';
      case '11v11': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="shadow-allplay border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-green" />
            Kommande matcher
          </CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {matches.length} matcher
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {matches.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Inga kommande matcher</h3>
            <p className="text-gray-600 mb-4">
              Hitta eller skapa din nästa match för att komma igång!
            </p>
            <Button className="bg-primary-green hover:bg-dark-green text-white">
              <MapPin className="w-4 h-4 mr-2" />
              Hitta matcher
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {matches.slice(0, 4).map((match) => (
              <div key={match.id} className="p-6 hover:bg-gray-50/80 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-green transition-colors">
                          {match.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatMatchTime(match.date, match.time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Plan {match.venue_id}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {match.current_players}/{match.max_players}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getFormatColor(match.format)}>
                        {match.format}
                      </Badge>
                      <Badge variant="outline" className="text-gray-600">
                        ELO: {match.skill_level_min}-{match.skill_level_max}
                      </Badge>
                      {match.is_ranked && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Rankad
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Button 
                      size="sm" 
                      className="bg-primary-green hover:bg-dark-green text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Anmäl dig
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}