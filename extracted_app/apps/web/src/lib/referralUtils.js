import pb from './pocketbaseClient';

/**
 * Processes a referral reward when a referred user upgrades to a paid plan.
 * Adds 30 days to both the referred user and the referrer's plan expiry.
 * 
 * @param {string} referredUserId - The ID of User B who is upgrading
 * @param {string} planId - The ID of the plan they upgraded to
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const processSubscriptionUpgrade = async (referredUserId, planId) => {
  try {
    // 1. Update the referred user's (User B) subscription by assigning new plan and adding 30 days
    const userPlans = await pb.collection('user_plans').getList(1, 1, {
      filter: `user_id="${referredUserId}"`,
      sort: '-created',
      $autoCancel: false
    });

    let currentExpiry = new Date();
    let userPlanId = null;

    if (userPlans.items.length > 0) {
      const plan = userPlans.items[0];
      userPlanId = plan.id;
      if (plan.expiry_date && new Date(plan.expiry_date) > new Date()) {
        currentExpiry = new Date(plan.expiry_date);
      }
      
      // Add 30 days for the user who purchased
      currentExpiry.setDate(currentExpiry.getDate() + 30);
      await pb.collection('user_plans').update(userPlanId, {
        expiry_date: currentExpiry.toISOString(),
        plan_id: planId
      }, { $autoCancel: false });
    } else {
      // Create new plan if they don't have one
      currentExpiry.setDate(currentExpiry.getDate() + 30);
      await pb.collection('user_plans').create({
        user_id: referredUserId,
        plan_id: planId,
        assigned_date: new Date().toISOString(),
        expiry_date: currentExpiry.toISOString()
      }, { $autoCancel: false });
    }
    
    // Also update users collection plan reference
    await pb.collection('users').update(referredUserId, { plan_id: planId }, { $autoCancel: false });

    // 2. Find the pending referral record
    const referrals = await pb.collection('referrals').getList(1, 1, {
      filter: `referred_user_id="${referredUserId}" && status="pending"`,
      $autoCancel: false
    });

    if (referrals.items.length === 0) {
      return { success: true, message: 'Plan purchased successfully.' };
    }

    const referral = referrals.items[0];
    const referrerId = referral.referrer_id;

    // 3. Update the referrer's (User A) subscription by adding 30 days
    const referrerPlans = await pb.collection('user_plans').getList(1, 1, {
      filter: `user_id="${referrerId}"`,
      sort: '-created',
      $autoCancel: false
    });

    if (referrerPlans.items.length > 0) {
      const rPlan = referrerPlans.items[0];
      let rExpiry = new Date();
      if (rPlan.expiry_date && new Date(rPlan.expiry_date) > new Date()) {
        rExpiry = new Date(rPlan.expiry_date);
      }
      rExpiry.setDate(rExpiry.getDate() + 30);
      
      await pb.collection('user_plans').update(rPlan.id, {
        expiry_date: rExpiry.toISOString()
      }, { $autoCancel: false });
    }

    // 4. Mark the referral as completed
    await pb.collection('referrals').update(referral.id, {
      status: 'completed',
      reward_given: true,
      completed_at: new Date().toISOString()
    }, { $autoCancel: false });

    return { success: true, message: 'Plan purchased and referral rewards applied successfully!' };

  } catch (error) {
    console.error('Error processing referral reward:', error);
    return { success: false, message: 'Failed to process subscription update: ' + error.message };
  }
};