export const STORAGE_BASE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/";

export const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('/')) return path; // Local assets
  return `${STORAGE_BASE_URL}${path}`;
};

export const extractFilenameFromUrl = (url) => {
  if (!url) return null;
  if (url.includes(STORAGE_BASE_URL)) {
    return url.replace(STORAGE_BASE_URL, '');
  }
  return url;
};