/**
 * Integrations facade — now backed by Supabase edge functions.
 *
 * Legacy import path kept so existing callsites don't break.
 * Prefer importing directly from '@/components/supabase/integrations'
 * in new code.
 */

export {
  Core,
  UploadFile,
  InvokeLLM,
  SendEmail,
  GenerateImage,
  ExtractDataFromUploadedFile,
} from '@/components/supabase/integrations';

// `SendSMS` was never implemented — stub kept so old imports don't crash.
export async function SendSMS() {
  throw new Error('SendSMS is not implemented.');
}