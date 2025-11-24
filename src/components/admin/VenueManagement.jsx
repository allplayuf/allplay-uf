import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  CheckCircle,
  Map as MapIcon,
  List,
  Keyboard
} from "lucide-react";
import { Venue } from "@/entities/Venue";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Draggable marker component with hover tooltip
function DraggableMarker({ venue, onPositionChange }) {
  const [position, setPosition] = useState([venue.latitude, venue.longitude]);

  const eventHandlers = {
    dragend(e) {
      const marker = e.target;
      const newPos = marker.getLatLng();
      setPosition([newPos.lat, newPos.lng]);
      onPositionChange(venue.id, newPos.lat, newPos.lng);
    }
  };

  const icon = L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 40px;
        position: relative;
      ">
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C9.373 2 4 7.373 4 14c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" 
                fill="#F4743B" 
                stroke="#FFFFFF" 
                stroke-width="2"/>
          <circle cx="16" cy="14" r="5" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    className: 'custom-draggable-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
  });

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
      icon={icon}
    >
      <Tooltip direction="top" offset={[0, -40]} opacity={0.9} permanent={false}>
        <div className="text-center">
          <div className="font-semibold text-sm">{venue.name}</div>
          <div className="text-xs text-gray-600">{venue.city}</div>
          <div className="text-xs text-gray-500 mt-1">
            {venue.latitude.toFixed(5)}, {venue.longitude.toFixed(5)}
          </div>
        </div>
      </Tooltip>
      
      <Popup>
        <div className="p-2">
          <h3 className="font-semibold text-sm mb-1">{venue.name}</h3>
          <p className="text-xs text-gray-600 mb-2">{venue.address}, {venue.city}</p>
          <div className="flex flex-wrap gap-1">
            {venue.formats_supported?.map(format => (
              <span key={format} className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded">
                {format}
              </span>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Keyboard handler for 'M' key
function KeyboardHandler({ onKeyPress, isAddingMode }) {
  const map = useMap();
  const [mousePos, setMousePos] = useState(null);

  useMapEvents({
    mousemove(e) {
      setMousePos(e.latlng);
    }
  });

  useEffect(() => {
    if (!isAddingMode) return;

    const handleKeyPress = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        if (mousePos) {
          onKeyPress(mousePos.lat, mousePos.lng);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [mousePos, onKeyPress, isAddingMode]);

  return null;
}

export default function VenueManagement({ venues: initialVenues, onRefresh }) {
  const [venues, setVenues] = useState(initialVenues);
  const [editingVenue, setEditingVenue] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newVenuePosition, setNewVenuePosition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('map');
  const [mapCenter, setMapCenter] = useState([59.3293, 18.0686]);
  const [sortBy, setSortBy] = useState('name');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingPosition, setPendingPosition] = useState(null);

  useEffect(() => {
    setVenues(initialVenues);
  }, [initialVenues]);

  const handleKeyPress = useCallback((lat, lng) => {
    setPendingPosition({ lat, lng });
    setShowCreateModal(true);
  }, []);

  const handleCreateVenue = useCallback(async (venueData) => {
    try {
      await Venue.create({
        ...venueData,
        latitude: pendingPosition.lat,
        longitude: pendingPosition.lng,
        is_active: true,
        is_verified: true,
        added_by_admin: true
      });
      
      setShowCreateModal(false);
      setPendingPosition(null);
      alert('Plan skapad!');
      onRefresh();
    } catch (error) {
      console.error("Error creating venue:", error);
      alert('Kunde inte skapa plan. Försök igen.');
    }
  }, [pendingPosition, onRefresh]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateModal(false);
    setPendingPosition(null);
  }, []);

  const handlePositionChange = async (venueId, lat, lng) => {
    try {
      await Venue.update(venueId, {
        latitude: lat,
        longitude: lng
      });
      
      setVenues(venues.map(v => 
        v.id === venueId ? { ...v, latitude: lat, longitude: lng } : v
      ));
      
      alert('Position uppdaterad!');
    } catch (error) {
      console.error("Error updating venue position:", error);
      alert('Kunde inte uppdatera position. Försök igen.');
    }
  };

  const handleSaveVenue = async (venueData) => {
    try {
      if (editingVenue && editingVenue.id) {
        await Venue.update(editingVenue.id, venueData);
        alert('Plan uppdaterad!');
      } else {
        await Venue.create(venueData);
        alert('Plan tillagd!');
      }
      
      setEditingVenue(null);
      setIsAddingNew(false);
      setNewVenuePosition(null);
      onRefresh();
    } catch (error) {
      console.error("Error saving venue:", error);
      alert('Kunde inte spara plan. Försök igen.');
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (!confirm('Är du säker på att du vill ta bort denna plan?')) return;
    
    try {
      await Venue.delete(venueId);
      setVenues(venues.filter(v => v.id !== venueId));
      alert('Plan borttagen!');
    } catch (error) {
      console.error("Error deleting venue:", error);
      alert('Kunde inte ta bort plan. Försök igen.');
    }
  };

  const filteredVenues = venues.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedVenues = [...filteredVenues].sort((a, b) => {
    switch(sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'city':
        return (a.city || '').localeCompare(b.city || '');
      case 'created':
        return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto flex gap-2">
              <Input
                placeholder="Sök planer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl"
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#121715] border-[#223029] rounded-xl">
                  <SelectItem value="name" className="text-[#F4F7F5]">Namn</SelectItem>
                  <SelectItem value="city" className="text-[#F4F7F5]">Stad</SelectItem>
                  <SelectItem value="created" className="text-[#F4F7F5]">Senast tillagd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setIsAddingNew(!isAddingNew);
                setActiveTab('map');
              }}
              className={`${
                isAddingNew 
                  ? 'bg-[#F4743B] hover:bg-[#E5683A]' 
                  : 'bg-[#2BA84A] hover:bg-[#248232]'
              } text-white w-full sm:w-auto rounded-xl h-11`}
            >
              {isAddingNew ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Avsluta läggningsläge
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#121715] border border-[#223029] p-1">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapIcon className="w-4 h-4" />
            Karta
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Lista ({venues.length})
          </TabsTrigger>
        </TabsList>

        {/* Map View */}
        <TabsContent value="map" className="space-y-4">
          {isAddingNew && (
            <Card className="bg-gradient-to-r from-[#2BA84A]/20 to-[#248232]/20 border border-[#2BA84A]/30 rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-[#2BA84A] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Keyboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F4F7F5] mb-1">Läggningsläge aktiverat</h3>
                  <p className="text-sm text-[#B6C2BC]">
                    Håll muspekaren över kartan och tryck <kbd className="px-2 py-1 bg-[#18221E] border border-[#223029] rounded text-[#2BA84A] font-mono text-xs">M</kbd> för att skapa en ny plan
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-[#121715] border border-[#223029] shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-[#223029]">
              <CardTitle className="flex items-center gap-2 text-[#F4F7F5]">
                <MapPin className="w-5 h-5 text-[#2BA84A]" />
                Justera planpositioner
              </CardTitle>
              <p className="text-sm text-[#B6C2BC] mt-2">
                Dra och släpp pins för att justera position
              </p>
            </CardHeader>
            <CardContent className="p-0 relative">
              <div className="h-[600px] w-full">
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  className="w-full h-full"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <KeyboardHandler onKeyPress={handleKeyPress} isAddingMode={isAddingNew} />
                  
                  {filteredVenues.map(venue => (
                    <DraggableMarker
                      key={venue.id}
                      venue={venue}
                      onPositionChange={handlePositionChange}
                    />
                  ))}
                </MapContainer>
              </div>

              {/* Enhanced Create Modal */}
              {showCreateModal && pendingPosition && (
                <QuickCreateModal
                  position={pendingPosition}
                  onConfirm={handleCreateVenue}
                  onCancel={handleCancelCreate}
                />
              )}
            </CardContent>
          </Card>

          {/* Edit Form */}
          {editingVenue && (
            <Card className="bg-[#121715] border border-[#223029] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-[#223029]">
                <CardTitle className="text-[#F4F7F5]">
                  Lägg till ny plan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <VenueForm
                  venue={editingVenue}
                  onSave={handleSaveVenue}
                  onCancel={() => {
                    setEditingVenue(null);
                    setIsAddingNew(false);
                    setNewVenuePosition(null);
                  }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <div className="grid md:grid-cols-2 gap-4">
            {sortedVenues.map(venue => (
              <Card key={venue.id} className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A] transition-all rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#F4F7F5] text-lg mb-1">{venue.name}</h3>
                      <div className="text-sm text-[#B6C2BC] space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          {venue.address}, {venue.city}
                        </div>
                        <div className="text-xs">
                          Koordinater: {venue.latitude?.toFixed(6)}, {venue.longitude?.toFixed(6)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {venue.is_verified && (
                        <CheckCircle className="w-5 h-5 text-[#2BA84A]" />
                      )}
                      <Badge className={venue.is_active ? 'bg-[#2BA84A]' : 'bg-[#6B7280]'}>
                        {venue.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {venue.formats_supported?.map(format => (
                      <Badge key={format} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingVenue(venue);
                        setIsAddingNew(false);
                        setActiveTab('map');
                        setMapCenter([venue.latitude, venue.longitude]);
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Redigera
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteVenue(venue.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Ta bort
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedVenues.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-[#248232] mx-auto mb-4 opacity-50" />
              <p className="text-[#B6C2BC]">Inga planer hittade</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .new-venue-marker {
          animation: bounce 0.5s infinite;
        }
      `}</style>
    </div>
  );
}

// Quick Create Modal Component
function QuickCreateModal({ position, onConfirm, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    surface_type: 'grass',
    formats_supported: ['5v5'],
    facilities: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  const toggleFacility = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#121715] border-2 border-[#2BA84A] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-[#223029]">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Skapa ny plan</h3>
                <p className="text-sm text-[#B6C2BC]">
                  Fyll i information om planen
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Coordinates Display */}
            <div className="bg-[#18221E] border border-[#223029] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#7B8A83] uppercase tracking-wide">Koordinater</span>
                <Badge className="bg-[#2BA84A]/20 text-[#2BA84A] border-0 text-xs">
                  Exakt position
                </Badge>
              </div>
              <div className="font-mono text-[#F4F7F5] text-xs">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </div>
            </div>

            {/* Name */}
            <div>
              <Label className="text-[#F4F7F5] mb-2 block">Plannamn *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                placeholder="T.ex. Östermalms IP"
              />
            </div>

            {/* Address */}
            <div>
              <Label className="text-[#F4F7F5] mb-2 block">Adress *</Label>
              <Input
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                placeholder="T.ex. Fiskartorpsvägen 20"
              />
            </div>

            {/* City */}
            <div>
              <Label className="text-[#F4F7F5] mb-2 block">Stad *</Label>
              <Input
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
                placeholder="T.ex. Stockholm"
              />
            </div>

            {/* Surface Type */}
            <div>
              <Label className="text-[#F4F7F5] mb-2 block">Underlag *</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, surface_type: 'grass' })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.surface_type === 'grass'
                      ? 'border-[#2BA84A] bg-[#2BA84A]/10 text-[#2BA84A]'
                      : 'border-[#223029] bg-[#18221E] text-[#B6C2BC] hover:border-[#2BA84A]/30'
                  }`}
                >
                  <div className="text-2xl mb-1">🌱</div>
                  <div className="text-xs font-semibold">Gräs</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, surface_type: 'artificial_turf' })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.surface_type === 'artificial_turf'
                      ? 'border-[#2BA84A] bg-[#2BA84A]/10 text-[#2BA84A]'
                      : 'border-[#223029] bg-[#18221E] text-[#B6C2BC] hover:border-[#2BA84A]/30'
                  }`}
                >
                  <div className="text-2xl mb-1">🟢</div>
                  <div className="text-xs font-semibold">Konstgräs</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, surface_type: 'futsal' })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.surface_type === 'futsal'
                      ? 'border-[#2BA84A] bg-[#2BA84A]/10 text-[#2BA84A]'
                      : 'border-[#223029] bg-[#18221E] text-[#B6C2BC] hover:border-[#2BA84A]/30'
                  }`}
                >
                  <div className="text-2xl mb-1">🏀</div>
                  <div className="text-xs font-semibold">Futsal</div>
                </button>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <Label className="text-[#F4F7F5] mb-2 block">Faciliteter</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleFacility('lighting')}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.facilities.includes('lighting')
                      ? 'border-[#2BA84A] bg-[#2BA84A]/10 text-[#2BA84A]'
                      : 'border-[#223029] bg-[#18221E] text-[#B6C2BC] hover:border-[#2BA84A]/30'
                  }`}
                >
                  <div className="text-xl mb-1">💡</div>
                  <div className="text-xs font-semibold">Belysning</div>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFacility('changing_rooms')}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.facilities.includes('changing_rooms')
                      ? 'border-[#2BA84A] bg-[#2BA84A]/10 text-[#2BA84A]'
                      : 'border-[#223029] bg-[#18221E] text-[#B6C2BC] hover:border-[#2BA84A]/30'
                  }`}
                >
                  <div className="text-xl mb-1">👕</div>
                  <div className="text-xs font-semibold">Omklädningsrum</div>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFacility('parking')}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.facilities.includes('parking')
                      ? 'border-[#2BA84A] bg-[#2BA84A]/10 text-[#2BA84A]'
                      : 'border-[#223029] bg-[#18221E] text-[#B6C2BC] hover:border-[#2BA84A]/30'
                  }`}
                >
                  <div className="text-xl mb-1">🅿️</div>
                  <div className="text-xs font-semibold">Parkering</div>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFacility('showers')}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.facilities.includes('showers')
                      ? 'border-[#2BA84A] bg-[#2BA84A]/10 text-[#2BA84A]'
                      : 'border-[#223029] bg-[#18221E] text-[#B6C2BC] hover:border-[#2BA84A]/30'
                  }`}
                >
                  <div className="text-xl mb-1">🚿</div>
                  <div className="text-xs font-semibold">Duschar</div>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-[#223029] flex gap-3">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5]"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#248232] hover:to-[#2BA84A] text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Skapa plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Venue Form Component
function VenueForm({ venue, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: venue?.name || '',
    address: venue?.address || '',
    city: venue?.city || '',
    latitude: venue?.latitude || 0,
    longitude: venue?.longitude || 0,
    type: venue?.type || 'public',
    formats_supported: venue?.formats_supported || ['5v5'],
    facilities: venue?.facilities || [],
    is_active: venue?.is_active !== undefined ? venue.is_active : true,
    is_verified: venue?.is_verified || false,
    added_by_admin: venue?.added_by_admin !== undefined ? venue.added_by_admin : true,
    contact_info: venue?.contact_info || '',
    image_url: venue?.image_url || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFormatToggle = (format) => {
    const formats = formData.formats_supported.includes(format)
      ? formData.formats_supported.filter(f => f !== format)
      : [...formData.formats_supported, format];
    setFormData({ ...formData, formats_supported: formats });
  };

  const handleFacilityToggle = (facility) => {
    const facilities = formData.facilities.includes(facility)
      ? formData.facilities.filter(f => f !== facility)
      : [...formData.facilities, facility];
    setFormData({ ...formData, facilities });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-[#F4F7F5]">Plannamn *</Label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
            placeholder="T.ex. Östermalms IP"
          />
        </div>

        <div>
          <Label className="text-[#F4F7F5]">Stad *</Label>
          <Input
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
            placeholder="T.ex. Stockholm"
          />
        </div>
      </div>

      <div>
        <Label className="text-[#F4F7F5]">Adress *</Label>
        <Input
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
          placeholder="T.ex. Fiskartorpsvägen 20"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-[#F4F7F5]">Latitude *</Label>
          <Input
            required
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
            className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
          />
        </div>

        <div>
          <Label className="text-[#F4F7F5]">Longitude *</Label>
          <Input
            required
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
            className="bg-[#18221E] border-[#223029] text-[#F4F7F5]"
          />
        </div>
      </div>

      <div>
        <Label className="text-[#F4F7F5]">Format som stöds</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {['5v5', '7v7', '11v11'].map(format => (
            <Badge
              key={format}
              onClick={() => handleFormatToggle(format)}
              className={`cursor-pointer ${
                formData.formats_supported.includes(format)
                  ? 'bg-[#2BA84A] text-white'
                  : 'bg-[#18221E] text-[#B6C2BC]'
              }`}
            >
              {format}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-[#F4F7F5]">Faciliteter</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {['changing_rooms', 'showers', 'parking', 'lighting', 'artificial_grass', 'natural_grass'].map(facility => (
            <Badge
              key={facility}
              onClick={() => handleFacilityToggle(facility)}
              className={`cursor-pointer ${
                formData.facilities.includes(facility)
                  ? 'bg-[#2BA84A] text-white'
                  : 'bg-[#18221E] text-[#B6C2BC]'
              }`}
            >
              {facility.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-[#F4F7F5]">Aktiv plan</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_verified}
            onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-[#F4F7F5]">Verifierad</span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Avbryt
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Spara plan
        </Button>
      </div>
    </form>
  );
}