/**
 * Backend function to provide Supabase config to frontend
 * Only exposes the anon key (public), never the service role key
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Get anon key from environment
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!anonKey) {
      return Response.json({ 
        error: 'Supabase not configured' 
      }, { status: 500 });
    }

    return Response.json({
      anonKey,
      url: 'https://vqfjjokqmykqawjlgevj.supabase.co'
    });
  } catch (error) {
    console.error('Error getting Supabase config:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});