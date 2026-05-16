/// <reference path="../pb_data/types.d.ts" />
onRecordUpdate((e) => {
  const original = e.record.original();
  const originalPlanId = original.get("plan_id");
  const newPlanId = e.record.get("plan_id");
  
  // Check if plan_id changed from null/empty to a non-null value (upgrade)
  const hadNoPlan = !originalPlanId || originalPlanId === "";
  const hasNewPlan = newPlanId && newPlanId !== "";
  
  if (hadNoPlan && hasNewPlan) {
    const userId = e.record.id;
    
    try {
      // Find the referral record where referred_user_id = this user's id
      const referralRecord = $app.findFirstRecordByFilter("referrals", "referred_user_id = {:userId}", { userId: userId });
      
      if (referralRecord) {
        // Increment upgraded_users_count
        const currentUpgrades = referralRecord.get("upgraded_users_count") || 0;
        referralRecord.set("upgraded_users_count", currentUpgrades + 1);
        
        // Add 30 days to earned_days_total
        const currentDays = referralRecord.get("earned_days_total") || 0;
        referralRecord.set("earned_days_total", currentDays + 30);
        
        $app.save(referralRecord);
      }
    } catch (err) {
      // Silently fail if referral record not found
      console.log("Referral record not found for user: " + userId);
    }
  }
  
  e.next();
}, "users");