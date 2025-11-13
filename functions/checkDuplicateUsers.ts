import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({
        error: 'ADMIN_ONLY',
        message: 'Endast admins kan köra denna funktion'
      }, { status: 403 });
    }

    console.log('=== CHECKING FOR DUPLICATE USERS ===');

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`Found ${allUsers.length} users`);

    // Check for duplicate usernames
    const usernameMap = new Map();
    const duplicateUsernames = [];
    
    for (const u of allUsers) {
      if (u.username) {
        const normalized = u.username.toLowerCase().trim();
        if (usernameMap.has(normalized)) {
          duplicateUsernames.push({
            username: normalized,
            users: [...usernameMap.get(normalized), u.id]
          });
          usernameMap.get(normalized).push(u.id);
        } else {
          usernameMap.set(normalized, [u.id]);
        }
      }
    }

    // Check for duplicate emails
    const emailMap = new Map();
    const duplicateEmails = [];
    
    for (const u of allUsers) {
      if (u.email) {
        const normalized = u.email.toLowerCase().trim();
        if (emailMap.has(normalized)) {
          duplicateEmails.push({
            email: normalized,
            users: [...emailMap.get(normalized), u.id]
          });
          emailMap.get(normalized).push(u.id);
        } else {
          emailMap.set(normalized, [u.id]);
        }
      }
    }

    console.log('=== CHECK COMPLETE ===');
    console.log(`Duplicate usernames: ${duplicateUsernames.length}`);
    console.log(`Duplicate emails: ${duplicateEmails.length}`);

    return Response.json({
      success: true,
      total_users: allUsers.length,
      duplicate_usernames: duplicateUsernames,
      duplicate_emails: duplicateEmails,
      users: allUsers.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        has_password: !!u.password_hash,
        created_date: u.created_date
      }))
    });

  } catch (error) {
    console.error('Check error:', error);
    return Response.json({
      error: 'CHECK_ERROR',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});