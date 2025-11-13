import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, X, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCustomDialog } from "../ui/custom-dialog";

const CATEGORIES = ['App', 'Matcher', 'Karta', 'Lag', 'Profil', 'Annat'];

export default function CreateFeedbackPost({ user, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'Annat',
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert, confirm } = useCustomDialog();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.body.trim()) {
      await alert('Saknas information', 'Fyll i titel och beskrivning.', { type: 'warning' });
      return;
    }

    if (formData.title.length > 80) {
      await alert('För lång titel', 'Titeln får max vara 80 tecken.', { type: 'warning' });
      return;
    }

    if (formData.body.length > 2000) {
      await alert('För lång beskrivning', 'Beskrivningen får max vara 2000 tecken.', { type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await base44.functions.invoke('feedback/createPost', {
        title: formData.title.trim(),
        body: formData.body.trim(),
        category: formData.category,
        tags: formData.tags
      });

      if (response.data.warning === 'similar_posts_found') {
        const shouldContinue = await confirm(
          'Liknande förslag finns',
          `Det finns redan ${response.data.similar.length} liknande förslag. Vill du ändå skapa ditt förslag?`,
          { 
            type: 'warning',
            confirmText: 'Ja, skapa',
            cancelText: 'Avbryt'
          }
        );

        if (!shouldContinue) {
          setIsSubmitting(false);
          return;
        }

        await base44.functions.invoke('feedback/createPost', {
          title: formData.title.trim(),
          body: formData.body.trim(),
          category: formData.category,
          tags: formData.tags,
          force: true
        });
      }

      // Close modal first
      onSuccess();
      
      // Then show success message
      await alert(
        'Tack för din feedback! 🎉',
        'Ditt förbättringsförslag har publicerats och andra kan nu rösta på det.',
        { type: 'success' }
      );

    } catch (error) {
      console.error('Error creating post:', error);
      
      if (error.message?.includes('olämpligt språk')) {
        await alert(
          'Olämpligt språk',
          'Din text innehåller ord som inte är tillåtna. Använd vänligt språk.',
          { type: 'alert' }
        );
      } else {
        await alert(
          'Ett fel uppstod',
          'Kunde inte skapa förslag. Försök igen.',
          { type: 'alert' }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="border-b border-[#223029] bg-gradient-to-br from-[#4169E1]/10 to-[#3457D5]/10 rounded-t-[20px] lg:rounded-t-[16px] p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl font-semibold text-[#F4F7F5] flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[#4169E1]" />
            <span>Nytt förslag</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-[#F4F7F5] font-semibold">Titel *</Label>
            <Input
              placeholder="Beskriv ditt förslag kort..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/30 rounded-[14px] h-12"
              maxLength={80}
            />
            <p className="text-xs text-[#7B8A83] text-right">{formData.title.length}/80</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-[#F4F7F5] font-semibold">Kategori *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#4169E1] h-12 rounded-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#121715] border border-[#223029]">
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label className="text-[#F4F7F5] font-semibold">Beskrivning *</Label>
            <Textarea
              placeholder="Beskriv ditt förslag i detalj. Varför är detta viktigt? Hur skulle det förbättra appen?"
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/30 h-32 rounded-[14px]"
              maxLength={2000}
            />
            <p className="text-xs text-[#7B8A83] text-right">{formData.body.length}/2000</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-12 rounded-[14px] border border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] font-semibold transition-all"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-[14px] bg-[#4169E1] text-white font-semibold hover:bg-[#3457D5] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>Skapar...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publicera
                </>
              )}
            </button>
          </div>
        </form>
      </CardContent>
    </div>
  );
}