import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, Upload, X, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TeamHighlights({ team, currentUser, isMember }) {
  const [highlights, setHighlights] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newHighlight, setNewHighlight] = useState({
    title: '',
    description: '',
    image_url: ''
  });

  useEffect(() => {
    loadHighlights();
  }, [team.id]);

  const loadHighlights = async () => {
    try {
      const highlightData = await base44.entities.TeamHighlight.filter({ team_id: team.id }, '-created_date', 20);
      
      const highlightsWithUsers = await Promise.all(
        highlightData.map(async (h) => {
          const userData = await base44.entities.User.get(h.posted_by);
          return { ...h, user: userData };
        })
      );
      
      setHighlights(highlightsWithUsers);
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vänligen välj en bildfil');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Bilden är för stor. Max 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewHighlight(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Kunde inte ladda upp bild. Försök igen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateHighlight = async (e) => {
    e.preventDefault();

    if (!newHighlight.title.trim()) {
      alert('Ange en rubrik');
      return;
    }

    try {
      await base44.entities.TeamHighlight.create({
        team_id: team.id,
        posted_by: currentUser.id,
        title: newHighlight.title.trim(),
        description: newHighlight.description.trim(),
        image_url: newHighlight.image_url,
        likes: []
      });

      await base44.entities.TeamMessage.create({
        team_id: team.id,
        user_id: currentUser.id,
        message_type: 'highlight_added',
        content: `📸 ${currentUser.full_name} lade till ett nytt highlight: ${newHighlight.title}`
      });

      setNewHighlight({ title: '', description: '', image_url: '' });
      setShowCreateForm(false);
      loadHighlights();
    } catch (error) {
      console.error('Error creating highlight:', error);
      alert('Kunde inte skapa highlight. Försök igen.');
    }
  };

  const handleToggleLike = async (highlightId) => {
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    try {
      const likes = highlight.likes || [];
      const hasLiked = likes.includes(currentUser.id);
      
      const updatedLikes = hasLiked
        ? likes.filter(id => id !== currentUser.id)
        : [...likes, currentUser.id];

      await base44.entities.TeamHighlight.update(highlightId, { likes: updatedLikes });
      loadHighlights();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (!isMember) {
    return (
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
        <CardContent className="p-12 text-center">
          <p className="text-[#B6C2BC]">Endast lagmedlemmar kan se highlights</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Highlight Button */}
      {!showCreateForm && (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-[#2BA84A]/16 hover:bg-[#2BA84A]/24 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Lägg till highlight
        </Button>
      )}

      {/* Create Highlight Form */}
      {showCreateForm && (
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-6">
            <form onSubmit={handleCreateHighlight} className="space-y-4">
              <div>
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Rubrik *</label>
                <Input
                  value={newHighlight.title}
                  onChange={(e) => setNewHighlight({ ...newHighlight, title: e.target.value })}
                  placeholder="T.ex. Vår första vinst!"
                  className="bg-[#18221E] border border-[#223029] text-[#F4F7F5]"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Beskrivning</label>
                <Textarea
                  value={newHighlight.description}
                  onChange={(e) => setNewHighlight({ ...newHighlight, description: e.target.value })}
                  placeholder="Berätta mer om detta ögonblick..."
                  className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] h-24"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Bild (valfritt)</label>
                {newHighlight.image_url ? (
                  <div className="relative">
                    <img
                      src={newHighlight.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setNewHighlight({ ...newHighlight, image_url: '' })}
                      className="absolute top-2 right-2 w-8 h-8 bg-[#DC2626] rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="highlight-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label htmlFor="highlight-upload">
                      <div className="border-2 border-dashed border-[#223029] rounded-xl p-8 text-center cursor-pointer hover:border-[#2BA84A] transition-colors">
                        {isUploading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-[#7B8A83] mx-auto mb-2" />
                            <p className="text-[13px] leading-[18px] text-[#B6C2BC]">Klicka för att ladda upp bild</p>
                            <p className="text-[11px] leading-[16px] text-[#7B8A83] mt-1">Max 5MB</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewHighlight({ title: '', description: '', image_url: '' });
                  }}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF]"
                  disabled={isUploading}
                >
                  Publicera
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Highlights Grid */}
      {highlights.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-12 h-12 text-[#9FC9AC] mx-auto mb-4" />
            <p className="text-[#B6C2BC]">Inga highlights än. Dela era bästa ögonblick!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {highlights.map((highlight) => {
            const likes = highlight.likes || [];
            const hasLiked = likes.includes(currentUser.id);

            return (
              <Card key={highlight.id} className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] hover:scale-[1.02] transition-all overflow-hidden">
                {highlight.image_url && (
                  <img
                    src={highlight.image_url}
                    alt={highlight.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardContent className="p-4">
                  <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5] mb-2">
                    {highlight.title}
                  </h3>
                  {highlight.description && (
                    <p className="text-[13px] leading-[18px] text-[#B6C2BC] mb-3">
                      {highlight.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-[#223029]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-[#FFFFFF] font-semibold">
                          {highlight.user?.full_name?.[0]}
                        </span>
                      </div>
                      <span className="text-[12px] leading-[16px] text-[#B6C2BC]">
                        {highlight.user?.full_name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleLike(highlight.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        hasLiked ? 'text-[#F4743B]' : 'text-[#7B8A83] hover:text-[#F4743B]'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="text-[13px] leading-[18px] font-medium">{likes.length}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}