/**
 * Sync Supabase Auth User to Base44 User Entity
 * 
 * This function ensures every Supabase authenticated user has a corresponding
 * Base44 User record. It is:
 * - Automatic: Called after successful auth
 * - Idempotent: Safe to call multiple times
 * - Invisible: User never sees this process
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the authenticated Supabase user data from request body
    const { supabase_user_id, email, full_name, provider } = await req.json();
    
    if (!supabase_user_id || !email) {
      return Response.json({ 
        error: 'Missing required fields: supabase_user_id, email' 
      }, { status: 400 });
    }

    console.log(`[syncUser] Syncing user: ${email} (${supabase_user_id})`);

    // Use service role to check if user exists and create if not
    // This bypasses user permissions since we're creating the user record
    const existingUsers = await base44.asServiceRole.entities.User.filter({ 
      email: email.toLowerCase() 
    });

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log(`[syncUser] User already exists: ${existingUser.id}`);
      
      // Update supabase_id if not set (migration case)
      if (!existingUser.supabase_id) {
        await base44.asServiceRole.entities.User.update(existingUser.id, {
          supabase_id: supabase_user_id,
          last_login: new Date().toISOString()
        });
        console.log(`[syncUser] Updated supabase_id for existing user`);
      } else {
        // Just update last login
        await base44.asServiceRole.entities.User.update(existingUser.id, {
          last_login: new Date().toISOString()
        });
      }

      return Response.json({
        ok: true,
        user: existingUser,
        created: false
      });
    }

    // User doesn't exist - create new Base44 user record
    console.log(`[syncUser] Creating new Base44 user for: ${email}`);
    
    const newUser = await base44.asServiceRole.entities.User.create({
      email: email.toLowerCase(),
      full_name: full_name || email.split('@')[0],
      supabase_id: supabase_user_id,
      role: 'user', // Default role - never admin by default
      auth_provider: provider || 'email',
      last_login: new Date().toISOString(),
      // Default profile settings
      skill_level: 'intermediate',
      matches_played: 0,
      mvp_count: 0,
      current_streak: 0,
      publicProfile: true,
      onboarding_completed: false
    });

    console.log(`[syncUser] Created new user: ${newUser.id}`);

    return Response.json({
      ok: true,
      user: newUser,
      created: true
    });

  } catch (error) {
    console.error('[syncUser] Error:', error);
    
    // Return success anyway to not block user - log for debugging
    // The user can still use the app, we just won't have their profile synced
    return Response.json({
      ok: false,
      error: error.message,
      // Don't block the user - they're authenticated in Supabase
      recoverable: true
    }, { status: 200 }); // Return 200 to not block auth flow
  }
});