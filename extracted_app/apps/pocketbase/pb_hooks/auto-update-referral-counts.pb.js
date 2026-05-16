/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // Auto-update referral counts when a new referral record is created
  const referrerId = e.record.get("referrer_id");
  
  if (!referrerId) {
    e.next();
    return;
  }
  
  try {
    // Find the referral record to update counts
    const referralRecord = $app.findRecordById("referrals", e.record.id);
    
    // Count registered users (referred users with status 'pending' or 'completed')
    const registeredCount = $app.findRecordsByFilter(
      "referrals",
      "referrer_id = '" + referrerId + "'",
      "-created",
      1000
    ).length;
    
    // Count upgraded users (referred users who have completed status)
    const upgradedCount = $app.findRecordsByFilter(
      "referrals",
      "referrer_id = '" + referrerId + "' && status = 'completed'",
      "-created",
      1000
    ).length;
    
    // Update the counts
    referralRecord.set("registered_users_count", registeredCount);
    referralRecord.set("upgraded_users_count", upgradedCount);
    
    $app.save(referralRecord);
  } catch (err) {
    console.log("Error updating referral counts: " + err.message);
  }
  
  e.next();
}, "referrals");

// Hook to update referral counts when a user upgrades their plan
onRecordAfterUpdateSuccess((e) => {
  const planId = e.record.get("plan_id");
  const originalPlanId = e.record.original().get("plan_id");
  
  // Only process if plan was actually changed
  if (planId === originalPlanId) {
    e.next();
    return;
  }
  
  try {
    const userId = e.record.id;
    
    // Find referral records where this user is the referred user
    const referrals = $app.findRecordsByFilter(
      "referrals",
      "referred_user_id = '" + userId + "'",
      "-created",
      1000
    );
    
    // Update each referral record to mark as completed if plan was upgraded
    for (let i = 0; i < referrals.length; i++) {
      const referral = referrals[i];
      
      // Mark as completed when user upgrades to a paid plan
      if (planId && planId !== "") {
        referral.set("status", "completed");
        referral.set("completed_at", new Date().toISOString().split('T')[0]);
        referral.set("reward_given", true);
        
        // Update upgraded count for referrer
        const referrerId = referral.get("referrer_id");
        const referrerReferrals = $app.findRecordsByFilter(
          "referrals",
          "referrer_id = '" + referrerId + "' && status = 'completed'",
          "-created",
          1000
        );
        
        referral.set("upgraded_users_count", referrerReferrals.length);
        $app.save(referral);
      }
    }
  } catch (err) {
    console.log("Error updating referral status on plan upgrade: " + err.message);
  }
  
  e.next();
}, "users");