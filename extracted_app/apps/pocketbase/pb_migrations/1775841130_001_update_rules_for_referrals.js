/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("referrals");
  collection.listRule = "referrer_id = @request.auth.id || referred_user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.viewRule = "referrer_id = @request.auth.id || referred_user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("referrals");
  collection.listRule = "referrer_id = @request.auth.id || referred_user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.viewRule = "referrer_id = @request.auth.id || referred_user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  return app.save(collection);
})