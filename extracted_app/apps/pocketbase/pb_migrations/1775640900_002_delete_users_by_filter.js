/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Find all users with empty or null phone numbers
  const users = app.findRecordsByFilter("users", "phone = '' || phone = null");
  
  for (const user of users) {
    // First, delete all referral records where this user is the referrer
    const referralsAsReferrer = app.findRecordsByFilter("referrals", `referrer_id = "${user.id}"`);
    for (const referral of referralsAsReferrer) {
      app.delete(referral);
    }
    
    // Then, delete all referral records where this user is the referred user
    const referralsAsReferred = app.findRecordsByFilter("referrals", `referred_user_id = "${user.id}"`);
    for (const referral of referralsAsReferred) {
      app.delete(referral);
    }
    
    // Finally, delete the user record
    app.delete(user);
  }
}, (app) => {
  // Rollback: record data not stored, manual restore needed
  // To restore: first restore user records, then restore referral records
})