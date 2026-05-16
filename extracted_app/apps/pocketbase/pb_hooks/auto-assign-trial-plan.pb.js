/// <reference path="../pb_data/types.d.ts" />
onRecordCreate((e) => {
  // Only auto-assign plan_id if not already set
  if (!e.record.get("plan_id")) {
    try {
      // Find the trial plan: status='active' and name contains 'trial'
      const trialPlan = $app.findFirstRecordByFilter("plans", "status = 'active' && name ~ 'trial'");
      if (trialPlan) {
        e.record.set("plan_id", trialPlan.id);
      }
    } catch (err) {
      // If no trial plan found, continue without setting plan_id
      console.log("Trial plan not found or error occurred: " + err.message);
    }
  }
  e.next();
}, "users");