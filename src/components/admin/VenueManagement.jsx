import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Plus, Trash2, Save, X, CheckCircle,
  Map as MapIcon, List, Keyboard, Filter, RefreshCw, Star, Clock
} from "lucide-react";
import { createVenue, deleteVenue } from "../supabase/services/venuesService";
import { getAuthHeaders, SUPABASE_URL } from '../supabase/config';
import VenueAvailabilityEditor from './VenueAvailabilityEditor';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminSectionHeader from "./AdminSectionHeader";

const PAGE_SIZE = 50;

function DraggableMarker({ venue, onPositionChange, onDelete }) {
  const [position, setPosition] = useState([venue.latitude, venue.longitude]);
  const eventHandlers = {
    dragend(e) {
      const pos = e.target.getLatLng();
      setPosition([pos.lat, pos.lng]);
      onPositionChange(venue.id, pos.lat, pos.lng);
    }
  };

  const icon = L.divIcon({
    html: `<svg width="28" height="36" viewBox="0 0 28 36"><path d="M14 2C8.5 2 4 6.5 4 12c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z" fill="#F4743B" stroke="#FFF" stroke-width="1.5"/><circle cx="14" cy="12" r="4" fill="#FFF"/></svg>`,
    className: '', iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -36]
  });

  return (
    <Marker position={position} draggable icon={icon} eventHandlers={eventHandlers}>
      <Tooltip direction="top" offset={[0, -36]}>
        <div className="text-center text-xs"><b>{venue.name}</b><br/>{venue.city}</div>
      </Tooltip>
      <Popup>
        <div className="p-1">
          <b className="text-sm">{venue.name}</b>
          <p className="text-xs text-gray-600">{venue.address}, {venue.city}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(venue.id); }}
            className="mt-2 w-full text-xs bg-red-600 text-white px-2 py-1 rounded"
          >Ta bort</button>
        </div>
      </Popup>
    </Marker>
  );
}

function KeyboardHandler({ onKeyPress, isAddingMode }) {
  const [mousePos, setMousePos] = useState(null);
  useMapEvents({ mousemove(e) { setMousePos(e.latlng); } });

  useEffect(() => {
    if (!isAddingMode) return;
    const handler = (e) => {
      if ((e.key === 'm' || e.key === 'M') && mousePos) onKeyPress(mousePos.lat, mousePos.lng);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mousePos, onKeyPress, isAddingMode]);

  return null;
}

export default function VenueManagement({ venues: propVenues = [], isLoading, lastUpdated, onRefresh, onDeleteDuplicates }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [activeTab, setActiveTab] = useState('list');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pendingPosition, setPendingPosition] = useState(null);
  const [page, setPage] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [scheduleVenue, setScheduleVenue] = useState(null);
  const [filterAllplay, setFilterAllplay] = useState('all'); // 'all' | 'allplay' | 'other'

  // Deduplicate venues by id (Supabase is source of truth)
  const venues = useMemo(() => {
    const seen = new Set();
    return propVenues.filter(v => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [propVenues]);

  // Detect duplicates by name (case-insensitive, trimmed)
  const duplicateGroups = useMemo(() => {
    const nameMap = {};
    venues.forEach(v => {
      const key = (v.name || '').trim().toLowerCase();
      if (!key) return;
      if (!nameMap[key]) nameMap[key] = [];
      nameMap[key].push(v);
    });
    // Only groups with 2+ venues are duplicates
    return Object.values(nameMap).filter(group => group.length > 1);
  }, [venues]);

  // IDs to delete = all duplicates except first in each group
  const duplicateIdsToDelete = useMemo(() => {
    return duplicateGroups.flatMap(group => group.slice(1).map(v => v.id));
  }, [duplicateGroups]);

  const handleToggleAllplay = async (venueId, currentValue) => {
    setActionLoading(venueId + '_allplay');
    try {
      const headers = await getAuthHeaders();
      await fetch(
        `${SUPABASE_URL}/rest/v1/venues?id=eq.${encodeURIComponent(venueId)}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ is_allplay: !currentValue })
        }
      );
      onRefresh();
    } catch (error) {
      console.error('[VenueManagement] Toggle allplay failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...venues];
    if (filterAllplay === 'allplay') list = list.filter(v => v.is_allplay);
    if (filterAllplay === 'other') list = list.filter(v => !v.is_allplay);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.address?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'city') return (a.city || '').localeCompare(b.city || '');
      if (sortBy === 'newest') return (b.created_at || b.created_date || '').localeCompare(a.created_at || a.created_date || '');
      return 0;
    });
    return list;
  }, [venues, searchTerm, sortBy]);

  const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const handleKeyPress = useCallback((lat, lng) => {
    setPendingPosition({ lat, lng });
    setShowCreateModal(true);
  }, []);

  const handleCreateVenue = async (formData) => {
    setActionLoading('create');
    try {
      await createVenue({
        ...formData,
        latitude: pendingPosition?.lat ?? formData.latitude,
        longitude: pendingPosition?.lng ?? formData.longitude,
        is_verified: true,
      });
      setShowCreateModal(false);
      setShowCreateForm(false);
      setPendingPosition(null);
      onRefresh();
    } catch (error) {
      console.error('[VenueManagement] Create failed:', error);
      window.alert('Kunde inte skapa plan: ' + (error.message || 'Okänt fel'));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePositionChange = async (venueId, lat, lng) => {
    // Position change via REST PATCH
    const { getAuthHeaders, SUPABASE_URL } = await import('../supabase/config');
    const headers = await getAuthHeaders();
    await fetch(
      `${SUPABASE_URL}/rest/v1/venues?id=eq.${encodeURIComponent(venueId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ lat, lng })
      }
    );
    onRefresh();
  };

  const handleDeleteVenue = async (venueId) => {
    if (!confirm('Radera denna plan permanent?')) return;
    setActionLoading(venueId);
    try {
      await deleteVenue(venueId);
      // Force refetch to confirm deletion
      onRefresh();
    } catch (error) {
      console.error('[VenueManagement] Delete failed:', error);
      window.alert('Kunde inte radera plan: ' + (error.message || 'Okänt fel. Kolla om RLS tillåter DELETE för din roll.'));
      // Still refetch to show current state
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminSectionHeader
        title="Planer"
        icon={MapPin}
        iconColor="#9370DB"
        totalCount={venues.length}
        filteredCount={filtered.length}
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setPage(0); }}
        searchPlaceholder="Sök plan, stad, adress..."
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
      >
        <Select value={filterAllplay} onValueChange={setFilterAllplay}>
          <SelectTrigger className="w-36 h-10 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl text-sm">
            <Star className="w-3.5 h-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#121715] border-[#223029]">
            <SelectItem value="all" className="text-[#F4F7F5]">Alla planer</SelectItem>
            <SelectItem value="allplay" className="text-[#2BA84A]">AllPlay</SelectItem>
            <SelectItem value="other" className="text-[#9EAAA4]">Övriga</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-28 h-10 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl text-sm">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#121715] border-[#223029]">
            <SelectItem value="name" className="text-[#F4F7F5]">Namn</SelectItem>
            <SelectItem value="city" className="text-[#F4F7F5]">Stad</SelectItem>
            <SelectItem value="newest" className="text-[#F4F7F5]">Nyast</SelectItem>
          </SelectContent>
        </Select>
      </AdminSectionHeader>

      {/* Duplicate warning */}
      {duplicateGroups.length > 0 && (
        <Card className="bg-[#F4743B]/10 border border-[#F4743B]/30 rounded-[16px]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#F4F7F5] text-sm mb-1">
                  ⚠️ {duplicateGroups.length} dubbletter hittade ({duplicateIdsToDelete.length} extra)
                </h3>
                <div className="space-y-1 text-xs text-[#B6C2BC]">
                  {duplicateGroups.map((group, i) => (
                    <div key={i}>
                      <span className="text-[#F4F7F5] font-medium">{group[0].name}</span>
                      {' – '}{group.length} st
                    </div>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onDeleteDuplicates(duplicateIdsToDelete)}
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs rounded-lg flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Radera {duplicateIdsToDelete.length} dubbletter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#121715] border border-[#223029] p-1 rounded-xl">
          <TabsTrigger value="list" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-[#2BA84A] data-[state=active]:text-white text-[#B6C2BC]">
            <List className="w-3.5 h-3.5" /> Lista
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-[#2BA84A] data-[state=active]:text-white text-[#B6C2BC]">
            <MapIcon className="w-3.5 h-3.5" /> Karta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {/* Create new venue button */}
          <div className="mb-3">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`${showCreateForm ? 'bg-[#F4743B] hover:bg-[#E5683A]' : 'bg-[#2BA84A] hover:bg-[#248232]'} text-white rounded-xl h-10`}
            >
              {showCreateForm ? <><X className="w-4 h-4 mr-1" />Avbryt</> : <><Plus className="w-4 h-4 mr-1" />Skapa ny plan</>}
            </Button>
          </div>

          {/* Inline create form */}
          {showCreateForm && (
            <QuickCreateModal
              position={null}
              onConfirm={handleCreateVenue}
              onCancel={() => setShowCreateForm(false)}
              isLoading={actionLoading === 'create'}
              showCoords
            />
          )}

          {isLoading ? (
            <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
              <CardContent className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-[#9370DB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#B6C2BC]">Laddar planer från Supabase...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
              <CardContent className="p-12 text-center">
                <MapPin className="w-12 h-12 text-[#9370DB]/40 mx-auto mb-3" />
                <h3 className="font-semibold text-[#F4F7F5] mb-1">Inga planer hittade</h3>
                <p className="text-sm text-[#B6C2BC]">
                  {searchTerm ? 'Ändra sökningen.' : 'Inga planer finns i Supabase.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paginated.map(venue => (
                <Card key={venue.id} className={`bg-[#121715] border rounded-[14px] transition-colors ${venue.is_allplay ? 'border-[#2BA84A]/30 hover:border-[#2BA84A]/50' : 'border-[#223029] hover:border-[#9370DB]/20'}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-[#F4F7F5] text-sm truncate">{venue.name}</span>
                          {venue.is_verified && <CheckCircle className="w-3.5 h-3.5 text-[#2BA84A]" />}
                          {venue.is_allplay && (
                            <Badge className="text-[10px] bg-[#2BA84A]/20 text-[#2BA84A] border border-[#2BA84A]/30">
                              <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> AllPlay
                            </Badge>
                          )}
                          <Badge className={`text-[10px] ${venue.is_active !== false ? 'bg-[#2BA84A]/15 text-[#2BA84A]' : 'bg-[#6B7280]/15 text-[#6B7280]'}`}>
                            {venue.is_active !== false ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#7B8A83]">
                          <span>{[venue.address, venue.city].filter(Boolean).join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* AllPlay toggle */}
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleToggleAllplay(venue.id, venue.is_allplay)}
                          disabled={actionLoading === venue.id + '_allplay'}
                          className={`h-8 px-2 text-xs rounded-lg ${venue.is_allplay ? 'border-[#2BA84A]/40 text-[#2BA84A] hover:bg-[#2BA84A]/10' : 'border-[#223029] text-[#9EAAA4] hover:text-[#2BA84A]'}`}
                          title={venue.is_allplay ? 'Ta bort AllPlay-status' : 'Markera som AllPlay-plan'}
                        >
                          <Star className={`w-3.5 h-3.5 ${venue.is_allplay ? 'fill-current' : ''}`} />
                        </Button>
                        {/* Schedule button (only for AllPlay venues) */}
                        {venue.is_allplay && (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => setScheduleVenue(venue)}
                            className="h-8 px-2 text-xs rounded-lg border-[#223029] text-[#9EAAA4] hover:text-[#F4743B] hover:border-[#F4743B]/40"
                            title="Redigera schema"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm" variant="destructive"
                          onClick={() => handleDeleteVenue(venue.id)}
                          disabled={actionLoading === venue.id}
                          className="h-8 px-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs rounded-lg"
                        >
                          {actionLoading === venue.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {hasMore && (
                <div className="text-center">
                  <button onClick={() => setPage(p => p + 1)} className="text-sm text-[#9370DB] font-semibold py-2">
                    Visa fler ({filtered.length - paginated.length} kvar)
                  </button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="map">
          <div className="space-y-3">
            <Button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className={`${isAddingNew ? 'bg-[#F4743B] hover:bg-[#E5683A]' : 'bg-[#2BA84A] hover:bg-[#248232]'} text-white rounded-xl h-10`}
            >
              {isAddingNew ? <><X className="w-4 h-4 mr-1" />Avsluta</> : <><Plus className="w-4 h-4 mr-1" />Lägg till plan</>}
            </Button>

            {isAddingNew && (
              <div className="p-3 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl text-sm text-[#B6C2BC]">
                Tryck <kbd className="px-1.5 py-0.5 bg-[#18221E] border border-[#223029] rounded text-[#2BA84A] font-mono text-xs">M</kbd> över kartan
              </div>
            )}

            <Card className="bg-[#121715] border border-[#223029] rounded-[16px] overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[500px] w-full">
                  <MapContainer center={[59.3293, 18.0686]} zoom={12} className="w-full h-full" scrollWheelZoom>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; CARTO'
                    />
                    <KeyboardHandler onKeyPress={handleKeyPress} isAddingMode={isAddingNew} />
                    {filtered.filter(v => v.latitude && v.longitude).map(venue => (
                      <DraggableMarker key={venue.id} venue={venue} onPositionChange={handlePositionChange} onDelete={handleDeleteVenue} />
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {showCreateModal && pendingPosition && (
              <QuickCreateModal
                position={pendingPosition}
                onConfirm={handleCreateVenue}
                onCancel={() => { setShowCreateModal(false); setPendingPosition(null); }}
                isLoading={actionLoading === 'create'}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Availability Editor Modal */}
      {scheduleVenue && (
        <VenueAvailabilityEditor
          venue={scheduleVenue}
          onClose={() => setScheduleVenue(null)}
        />
      )}
    </div>
  );
}

function QuickCreateModal({ position, onConfirm, onCancel, isLoading, showCoords }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    latitude: position?.lat ?? '',
    longitude: position?.lng ?? '',
    formats_supported: ['5v5'],
    facilities: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      ...formData,
      latitude: position?.lat ?? (parseFloat(formData.latitude) || null),
      longitude: position?.lng ?? (parseFloat(formData.longitude) || null),
    });
  };

  // Inline card for list tab, modal for map tab
  if (!position && showCoords) {
    return (
      <Card className="bg-[#121715] border-2 border-[#2BA84A] rounded-2xl mb-3">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <h3 className="text-lg font-bold text-[#F4F7F5] mb-2">Ny plan</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#F4F7F5] text-xs mb-1 block">Namn *</Label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9" />
              </div>
              <div>
                <Label className="text-[#F4F7F5] text-xs mb-1 block">Stad *</Label>
                <Input required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9" />
              </div>
            </div>
            <div>
              <Label className="text-[#F4F7F5] text-xs mb-1 block">Adress *</Label>
              <Input required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#F4F7F5] text-xs mb-1 block">Latitud</Label>
                <Input type="number" step="any" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9" placeholder="59.33" />
              </div>
              <div>
                <Label className="text-[#F4F7F5] text-xs mb-1 block">Longitud</Label>
                <Input type="number" step="any" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9" placeholder="18.07" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={onCancel} variant="outline" className="flex-1 border-[#223029] text-[#B6C2BC]">Avbryt</Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white">
                {isLoading ? 'Skapar...' : 'Skapa'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <form onSubmit={handleSubmit} className="bg-[#121715] border-2 border-[#2BA84A] rounded-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-[#223029]">
          <h3 className="text-lg font-bold text-[#F4F7F5]">Skapa ny plan</h3>
          {position && <p className="text-xs text-[#7B8A83] mt-1 font-mono">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>}
        </div>
        <div className="p-5 space-y-3">
          <div>
            <Label className="text-[#F4F7F5] text-xs mb-1 block">Namn *</Label>
            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9" />
          </div>
          <div>
            <Label className="text-[#F4F7F5] text-xs mb-1 block">Adress *</Label>
            <Input required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9" />
          </div>
          <div>
            <Label className="text-[#F4F7F5] text-xs mb-1 block">Stad *</Label>
            <Input required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9" />
          </div>
        </div>
        <div className="p-5 border-t border-[#223029] flex gap-3">
          <Button type="button" onClick={onCancel} variant="outline" className="flex-1 border-[#223029] text-[#B6C2BC]">Avbryt</Button>
          <Button type="submit" disabled={isLoading} className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white">
            {isLoading ? 'Skapar...' : 'Skapa'}
          </Button>
        </div>
      </form>
    </div>
  );
}