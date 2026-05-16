/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("referrals");
  collection.indexes.push("CREATE INDEX idx_referrals_referrer_id ON referrals (referrer_id)");
  collection.indexes.push("CREATE INDEX idx_referrals_referred_user_id ON referrals (referred_user_id)");
  collection.indexes.push("CREATE INDEX idx_referrals_status ON referrals (status)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("referrals");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_referrals_referrer_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_referrals_referred_user_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_referrals_status"));
  return app.save(collection);
})