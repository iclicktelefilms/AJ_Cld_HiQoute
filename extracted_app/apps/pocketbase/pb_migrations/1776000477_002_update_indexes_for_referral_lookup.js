/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("referral_lookup");
  collection.indexes.push("CREATE UNIQUE INDEX idx_referral_lookup_referralCode ON referral_lookup (referralCode)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("referral_lookup");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_referral_lookup_referralCode"));
  return app.save(collection);
})