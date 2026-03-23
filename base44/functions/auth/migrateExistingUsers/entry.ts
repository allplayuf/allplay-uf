import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

async function hashPassword(password) {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const combined = new Uint8Array(salt.length + hash.byteLength);
    combined.set(salt, 0);
    combined.set(new Uint8Array(hash), salt.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Password hashing error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({
        error: 'ADMIN_ONLY',
        message: 'Endast admins kan köra migration'
      }, { status: 403 });
    }

    console.log('=== STARTING USER MIGRATION ===');
    console.log('Admin user:', user.email);

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`Found ${allUsers.length} users to check`);

    const defaultPassword = 'allplay123';
    const password_hash = await hashPassword(defaultPassword);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const migrationLog = [];

    for (const existingUser of allUsers) {
      try {
        // Skip if already has password
        if (existingUser.password_hash) {
          console.log(`Skipping ${existingUser.email} - already has password`);
          skipped++;
          continue;
        }

        // Prepare update data
        const updateData = {
          password_hash
        };

        // Ensure username exists
        if (!existingUser.username) {
          // Create username from email or display_name
          const baseUsername = existingUser.email 
            ? existingUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
            : existingUser.display_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
          
          // Check if username exists
          let username = baseUsername;
          let counter = 1;
          while (allUsers.some(u => u.username === username && u.id !== existingUser.id)) {
            username = `${baseUsername}${counter}`;
            counter++;
          }
          
          updateData.username = username;
        }

        // Ensure display_name exists
        if (!updateData.display_name && !existingUser.display_name) {
          updateData.display_name = existingUser.full_name || existingUser.email?.split('@')[0] || existingUser.username || 'Användare';
        }

        // Ensure full_name exists
        if (!existingUser.full_name) {
          updateData.full_name = existingUser.display_name || existingUser.email?.split('@')[0] || existingUser.username || 'Användare';
        }

        // Normalize city
        if (existingUser.city && !existingUser.cityNormalized) {
          updateData.cityNormalized = existingUser.city.toLowerCase().trim();
        }

        // Calculate is_minor if birth_year exists
        if (existingUser.birth_year && existingUser.is_minor === undefined) {
          const currentYear = new Date().getFullYear();
          updateData.is_minor = (currentYear - existingUser.birth_year) < 18;
        }

        // Set default values
        if (existingUser.status === undefined) {
          updateData.status = 'active';
        }
        if (existingUser.blocked === undefined) {
          updateData.blocked = false;
        }
        if (existingUser.publicProfile === undefined) {
          updateData.publicProfile = true;
        }
        if (existingUser.profile_completed === undefined) {
          updateData.profile_completed = false;
        }

        // Update user
        await base44.asServiceRole.entities.User.update(existingUser.id, updateData);
        
        migrated++;
        migrationLog.push({
          id: existingUser.id,
          email: existingUser.email,
          username: updateData.username || existingUser.username,
          status: 'migrated',
          changes: Object.keys(updateData)
        });

        console.log(`✓ Migrated: ${existingUser.email} (username: ${updateData.username || existingUser.username})`);

      } catch (error) {
        console.error(`Error migrating user ${existingUser.email}:`, error);
        errors++;
        migrationLog.push({
          id: existingUser.id,
          email: existingUser.email,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('=== MIGRATION COMPLETE ===');
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Log audit
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        actor_id: user.id,
        actor_role: 'admin',
        action: 'auth.migrateUsers',
        target_type: 'User',
        target_id: 'bulk',
        after: {
          migrated,
          skipped,
          errors,
          total: allUsers.length
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (auditError) {
      console.error('Audit log error (non-critical):', auditError);
    }

    return Response.json({
      success: true,
      message: 'Migration klar!',
      stats: {
        total: allUsers.length,
        migrated,
        skipped,
        errors
      },
      defaultPassword: defaultPassword,
      note: 'Alla användare kan nu logga in med sitt användarnamn eller e-post och lösenordet "allplay123"',
      log: migrationLog
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({
      error: 'MIGRATION_ERROR',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});