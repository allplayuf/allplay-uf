/**
 * Update Profile Edge Function
 * 
 * Updates user profile (full_name, username, avatar_url)
 * Validates username uniqueness and format
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Username validation regex: 3-30 chars, lowercase letters, numbers, dots, underscores
const USERNAME_REGEX = /^[a-z0-9._]{3,30}$/;

Deno.serve(async (req) => {
  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ ok: false, error: { message: 'Server configuration error' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: { message: 'Unauthorized' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: { message: 'Unauthorized' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse request body
    const { full_name, username, avatar_url } = await req.json();
    
    // Validate at least one field is provided
    if (!full_name && !username && !avatar_url) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { 
            code: 'NO_FIELDS', 
            message: 'Minst ett fält måste uppdateras' 
          } 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate username if provided
    if (username !== undefined) {
      // Check format
      if (!USERNAME_REGEX.test(username)) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: { 
              code: 'USERNAME_INVALID', 
              message: 'Ogiltigt användarnamn. Endast små bokstäver, siffror, punkt och understreck (3-30 tecken)' 
            } 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Check uniqueness
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', user.id);
      
      if (existingUsers && existingUsers.length > 0) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: { 
              code: 'USERNAME_TAKEN', 
              message: 'Användarnamnet är redan taget' 
            } 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Validate full_name if provided
    if (full_name !== undefined) {
      if (full_name.trim().length < 2) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: { 
              code: 'NAME_TOO_SHORT', 
              message: 'Namn måste vara minst 2 tecken' 
            } 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (full_name.length > 80) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: { 
              code: 'NAME_TOO_LONG', 
              message: 'Namn får vara max 80 tecken' 
            } 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Build update object
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name.trim();
    if (username !== undefined) updateData.username = username.toLowerCase().trim();
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    
    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('[updateProfile] Update error:', updateError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: { 
            message: 'Kunde inte uppdatera profil. Försök igen.' 
          } 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return success with updated user
    return new Response(
      JSON.stringify({ 
        ok: true, 
        user: updatedUser 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[updateProfile] Error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: { 
          message: 'Ett fel uppstod. Försök igen.' 
        } 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});