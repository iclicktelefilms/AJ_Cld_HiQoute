/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("packages");
  collection.createRule = "@request.auth.id != '' && (@request.auth.role = 'photographer' || @request.auth.role = 'super_admin')";
  collection.updateRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.deleteRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("packages");
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.deleteRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  return app.save(collection);
})