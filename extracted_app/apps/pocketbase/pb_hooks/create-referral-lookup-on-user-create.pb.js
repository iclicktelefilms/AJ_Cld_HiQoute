/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const referralCode = e.record.get("referral_code");
  
  // Skip if referral_code is missing
  if (!referralCode) {
    e.next();
    return;
  }
  
  try {
    const lookupRecord = new Record($app.findCollectionByNameOrId("referral_lookup"));
    lookupRecord.set("referralCode", referralCode);
    lookupRecord.set("user", e.record.id);
    $app.save(lookupRecord);
  } catch (err) {
    // Silently skip if creation fails (e.g., duplicate referral code)
    console.log("Failed to create referral_lookup record: " + err.message);
  }
  
  e.next();
}, "users");