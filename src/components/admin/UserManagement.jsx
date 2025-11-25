import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Shield,
  UserX,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Trophy,
  Filter,
  Trash2
} from "lucide-react";

export default function UserManagement({ users, onAction }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const cities = [...new Set(users.map(u => u.city).filter(Boolean))].sort();

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesCity = cityFilter === 'all' || user.city === cityFilter;

    return matchesSearch && matchesStatus && matchesCity;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    banned: users.filter(u => u.status === 'banned').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-[#2BA84A]/20 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30';
      case 'suspended': return 'bg-[#F4743B]/20 text-[#FDE3D2] ring-1 ring-[#F4743B]/30';
      case 'banned': return 'bg-red-500/20 text-red-200 ring-1 ring-red-500/30';
      default: return 'bg-gray-500/20 text-gray-200 ring-1 ring-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'suspended': return 'Avstängd';
      case 'banned': return 'Bannlyst';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-[#2BA84A]/16 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-[#2BA84A]/30">
              <Users className="w-6 h-6 text-[#9FC9AC]" />
            </div>
            <div className="text-3xl font-bold text-[#F4F7F5] mb-1">{stats.total}</div>
            <div className="text-sm text-[#B6C2BC]">Totalt användare</div>
          </CardContent>
        </Card>

        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-[#2BA84A]/16 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-[#2BA84A]/30">
              <CheckCircle className="w-6 h-6 text-[#2BA84A]" />
            </div>
            <div className="text-3xl font-bold text-[#2BA84A] mb-1">{stats.active}</div>
            <div className="text-sm text-[#B6C2BC]">Aktiva</div>
          </CardContent>
        </Card>

        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-[#F4743B]/16 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-[#F4743B]/30">
              <AlertTriangle className="w-6 h-6 text-[#F4743B]" />
            </div>
            <div className="text-3xl font-bold text-[#F4743B] mb-1">{stats.suspended}</div>
            <div className="text-sm text-[#B6C2BC]">Avstängda</div>
          </CardContent>
        </Card>

        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-red-500/16 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-red-500/30">
              <Ban className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400 mb-1">{stats.banned}</div>
            <div className="text-sm text-[#B6C2BC]">Bannlysta</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B6C2BC] w-5 h-5" />
              <Input
                placeholder="Sök användare..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] rounded-[12px]"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[12px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                <SelectItem value="all" className="text-[#F4F7F5]">Alla statusar</SelectItem>
                <SelectItem value="active" className="text-[#F4F7F5]">Aktiva</SelectItem>
                <SelectItem value="suspended" className="text-[#F4F7F5]">Avstängda</SelectItem>
                <SelectItem value="banned" className="text-[#F4F7F5]">Bannlysta</SelectItem>
              </SelectContent>
            </Select>

            {/* City Filter */}
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-11 bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[12px]">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Stad" />
              </SelectTrigger>
              <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                <SelectItem value="all" className="text-[#F4F7F5]">Alla städer</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city} className="text-[#F4F7F5]">{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
        <CardHeader className="border-b border-[#223029] p-4 sm:p-6">
          <CardTitle className="text-lg text-[#F4F7F5]">
            Användare ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#223029]">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-[#18221E] transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                    {user.profile_image_url ? (
                      <img src={user.profile_image_url} alt={user.full_name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-white font-semibold">{user.full_name?.[0] || 'U'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#F4F7F5] flex items-center gap-2 flex-wrap">
                          <span className="truncate">{user.full_name}</span>
                          {user.role === 'admin' && (
                            <Badge className="bg-[#F4743B]/20 text-[#FDE3D2] ring-1 ring-[#F4743B]/30 text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          <Badge className={getStatusColor(user.status)}>
                            {getStatusText(user.status)}
                          </Badge>
                        </h3>
                        <p className="text-sm text-[#B6C2BC] truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-[#B6C2BC] mb-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.city || 'Okänd'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {user.matches_played || 0} matcher
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {user.mvp_count || 0} MVPs
                      </span>
                    </div>

                    {/* Actions */}
                    {user.role !== 'admin' && (
                      <div className="flex gap-2 flex-wrap">
                        {user.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAction(user.id, 'suspend')}
                              className="h-8 text-xs border-[#223029] text-[#F4F7F5] hover:bg-[#223029]"
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Stäng av
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAction(user.id, 'ban')}
                              className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Bannlys
                            </Button>
                          </>
                        )}
                        {(user.status === 'suspended' || user.status === 'banned') && (
                          <Button
                            size="sm"
                            onClick={() => onAction(user.id, 'activate')}
                            className="h-8 text-xs bg-[#2BA84A] hover:bg-[#248232] text-white"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aktivera
                          </Button>
                          )}

                          <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onAction(user.id, 'delete')}
                          className="h-8 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Radera
                          </Button>
                          </div>
                          )}
                          </div>
                          </div>
                          </div>
                          ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#248232] mx-auto mb-4 opacity-50" />
              <p className="text-[#B6C2BC]">Inga användare hittade</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}