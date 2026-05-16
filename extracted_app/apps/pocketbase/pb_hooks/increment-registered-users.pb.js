/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const referredBy = e.record.get("referredBy");
  
  // Only process if user has a referrer
  if (!referredBy) {
    e.next();
    return;
  }
  
  try {
    // Find the referral record where referred_user_id = this new user's id
    const referralRecord = $app.findFirstRecordByFilter("referrals", "referred_user_id = {:referredBy}", { referredBy: referredBy });
    
    if (referralRecord) {
      // Increment registered_users_count
      const currentCount = referralRecord.get("registered_users_count") || 0;
      referralRecord.set("registered_users_count", currentCount + 1);
      $app.save(referralRecord);
    }
  } catch (err) {
    // Silently fail if referral record not found - user may have been referred but no referral record created yet
    console.log("Referral record not found for referrer: " + referredBy);
  }
  
  e.next();
}, "users");