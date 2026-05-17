import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Camera, Loader2, X } from 'lucide-react';
import { UploadFile } from '@/components/supabase/integrations';
import { feedback } from '@/components/ui/feedback-toast';
import ImageCropPicker from '@/components/ui/ImageCropPicker';

export default function AvatarUpload({ currentImageUrl, onUploaded }) {
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const inputRef = useRef(null);

  const displayUrl = preview || currentImageUrl;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      feedback.error('Vänligen välj en bild (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      feedback.error('Bilden är för stor. Max 5 MB.');
      return;
    }

    setCropFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCropConfirm = async (blob) => {
    setCropFile(null);

    const objectUrl = URL.createObjectURL(blob);
    setPreview(objectUrl);
    setImgError(false);

    setIsUploading(true);
    try {
      const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const { file_url } = await UploadFile({ file: croppedFile });
      if (file_url) {
        localStorage.setItem('allplay_profile_image', file_url);
      }
      onUploaded(file_url);
    } catch (err) {
      console.error('[AvatarUpload] Upload failed:', err);
      setPreview(null);
      feedback.error('Kunde inte ladda upp bilden. Försök igen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    setImgError(false);
    onUploaded('');
  };

  return (
    <>
      <AnimatePresence>
        {cropFile && (
          <ImageCropPicker
            file={cropFile}
            shape="circle"
            onCrop={handleCropConfirm}
            onCancel={() => setCropFile(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div
            onClick={() => !isUploading && inputRef.current?.click()}
            className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#2BA84A]/40 bg-gradient-to-br from-[#2BA84A]/20 to-[#248232]/10 flex items-center justify-center cursor-pointer hover:border-[#2BA84A]/70 transition-all"
          >
            {displayUrl && !imgError ? (
              <img
                src={displayUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-3xl font-bold text-[#2BA84A]/60">U</span>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => !isUploading && inputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#F4743B] rounded-xl flex items-center justify-center text-white ring-2 ring-[#121715] hover:bg-[#E5683A] transition-all disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
          </button>

          {displayUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -left-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white ring-2 ring-[#121715] hover:bg-red-500 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-xs text-[#7B8A83]">Tryck för att byta bild (max 5 MB)</p>
      </div>
    </>
  );
}
