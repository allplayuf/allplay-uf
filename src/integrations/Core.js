// Re-export of the existing Supabase integrations facade so that
// `import { UploadFile } from '@/integrations/Core'` keeps resolving
// after the Base44 vite plugin (which used to virtualize this path)
// has been removed.
export { Core, UploadFile } from '@/components/supabase/integrations';
