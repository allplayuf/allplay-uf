
import React, { useState, useEffect } from 'react';
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
  List
} from "lucide-react";
import { Venue } from "@/entities/Venue";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
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
      {/* Hover Tooltip */}
      <Tooltip direction="top" offset={[0, -40]} opacity={0.9} permanent={false}>
        <div className="text-center">
          <div className="font-semibold text-sm">{venue.name}</div>
          <div className="text-xs text-gray-600">{venue.city}</div>
          <div className="text-xs text-gray-500 mt-1">
            {venue.latitude.toFixed(5)}, {venue.longitude.toFixed(5)}
          </div>
        </div>
      </Tooltip>
      
      {/* Click Popup */}
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

// Add new venue by clicking map
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function VenueManagement({ venues: initialVenues, onRefresh }) {
  const [venues, setVenues] = useState(initialVenues);
  const [editingVenue, setEditingVenue] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newVenuePosition, setNewVenuePosition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('map');
  const [mapCenter, setMapCenter] = useState([59.3293, 18.0686]); // Stockholm default
  const [sortBy, setSortBy] = useState('name'); // 'name', 'city', or 'created'

  useEffect(() => {
    setVenues(initialVenues);
  }, [initialVenues]);

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
      if (editingVenue) {
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

  const handleMapClick = (lat, lng) => {
    if (isAddingNew) {
      setNewVenuePosition({ lat, lng });
      setEditingVenue({
        name: '',
        address: '',
        city: '',
        latitude: lat,
        longitude: lng,
        type: 'public',
        formats_supported: ['5v5'],
        facilities: [],
        is_active: true,
        is_verified: false
      });
    }
  };

  const filteredVenues = venues.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort venues
  const sortedVenues = [...filteredVenues].sort((a, b) => {
    switch(sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'city':
        return (a.city || '').localeCompare(b.city || '');
      case 'created':
        // Assuming 'created_date' exists as a Date string or similar
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
                setIsAddingNew(true);
                setActiveTab('map');
                alert('Klicka på kartan för att placera ny plan');
              }}
              className="bg-[#2BA84A] hover:bg-[#248232] text-white w-full sm:w-auto rounded-xl h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Lägg till plan
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
          <Card className="bg-[#121715] border border-[#223029] shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-[#223029]">
              <CardTitle className="flex items-center gap-2 text-[#F4F7F5]">
                <MapPin className="w-5 h-5 text-[#2BA84A]" />
                Justera planpositioner
              </CardTitle>
              <p className="text-sm text-[#B6C2BC] mt-2">
                {isAddingNew 
                  ? '📍 Klicka på kartan för att placera ny plan' 
                  : 'Dra och släpp pins för att justera exakt position'}
              </p>
            </CardHeader>
            <CardContent className="p-0">
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
                  
                  {isAddingNew && <MapClickHandler onMapClick={handleMapClick} />}
                  
                  {filteredVenues.map(venue => (
                    <DraggableMarker
                      key={venue.id}
                      venue={venue}
                      onPositionChange={handlePositionChange}
                    />
                  ))}
                  
                  {newVenuePosition && (
                    <Marker
                      position={[newVenuePosition.lat, newVenuePosition.lng]}
                      icon={L.divIcon({
                        html: `
                          <div style="
                            width: 32px;
                            height: 40px;
                            position: relative;
                            animation: bounce 0.5s infinite;
                          ">
                            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                              <path d="M16 2C9.373 2 4 7.373 4 14c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" 
                                    fill="#2BA84A" 
                                    stroke="#FFFFFF" 
                                    stroke-width="2"/>
                              <circle cx="16" cy="14" r="5" fill="#FFFFFF"/>
                            </svg>
                          </div>
                        `,
                        className: 'new-venue-marker',
                        iconSize: [32, 40],
                        iconAnchor: [16, 40]
                      })}
                    />
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form (shown when editing or adding) */}
          {editingVenue && (
            <Card className="bg-[#121715] border border-[#223029] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-[#223029]">
                <CardTitle className="text-[#F4F7F5]">
                  {isAddingNew ? 'Lägg till ny plan' : 'Redigera plan'}
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
