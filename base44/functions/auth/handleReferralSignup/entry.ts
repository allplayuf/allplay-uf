import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, referralCode } = await req.json();

    if (!userId) {
      return Response.json({ 
        success: false, 
        error: 'User ID required' 
      }, { status: 400 });
    }

    // If no referral code, just ensure user has a referral code generated
    if (!referralCode) {
      await base44.asServiceRole.entities.User.update(userId, {
        referral_code: userId.substring(0, 8)
      });
      
      return Response.json({ 
        success: true, 
        message: 'Referral code generated' 
      });
    }

    // Find the referrer by referral code
    const users = await base44.asServiceRole.entities.User.list();
    const referrer = users.find(u => 
      u.referral_code === referralCode || 
      u.id?.substring(0, 8) === referralCode
    );

    if (!referrer) {
      // Invalid code, but don't fail signup - just generate their own code
      await base44.asServiceRole.entities.User.update(userId, {
        referral_code: userId.substring(0, 8)
      });
      
      return Response.json({ 
        success: true, 
        message: 'Invalid referral code, but signup completed' 
      });
    }

    // Can't refer yourself
    if (referrer.id === userId) {
      await base44.asServiceRole.entities.User.update(userId, {
        referral_code: userId.substring(0, 8)
      });
      
      return Response.json({ 
        success: true, 
        message: 'Cannot refer yourself' 
      });
    }

    // Update new user with referrer info
    await base44.asServiceRole.entities.User.update(userId, {
      referred_by: referrer.id,
      referral_code: userId.substring(0, 8)
    });

    // Increment referrer's verified_referrals count
    const currentCount = referrer.verified_referrals || 0;
    await base44.asServiceRole.entities.User.update(referrer.id, {
      verified_referrals: currentCount + 1,
      referral_code: referrer.referral_code || referrer.id.substring(0, 8)
    });

    return Response.json({ 
      success: true, 
      referrerId: referrer.id,
      referrerName: referrer.full_name,
      newCount: currentCount + 1
    });

  } catch (error) {
    console.error('Error handling referral signup:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});