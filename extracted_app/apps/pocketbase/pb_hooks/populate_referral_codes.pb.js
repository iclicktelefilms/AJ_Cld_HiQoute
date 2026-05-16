/// <reference path="../pb_data/types.d.ts" />
onRecordCreate((e) => {
  // Generate a unique referral code if not already set
  if (!e.record.get("referral_code")) {
    // Generate a code like REF_abc123def456 (12 random chars)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "REF_";
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    e.record.set("referral_code", code);
  }
  e.next();
}, "users");

onRecordUpdate((e) => {
  // Ensure referral_code is never empty on update
  if (!e.record.get("referral_code")) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "REF_";
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    e.record.set("referral_code", code);
  }
  e.next();
}, "users");