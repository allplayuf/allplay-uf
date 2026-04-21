/**
 * Integrations facade — backed by Supabase edge functions.
 *
 * Only UploadFile is supported. AI/email integrations were removed.
 */

export { Core, UploadFile } from '@/components/supabase/integrations';