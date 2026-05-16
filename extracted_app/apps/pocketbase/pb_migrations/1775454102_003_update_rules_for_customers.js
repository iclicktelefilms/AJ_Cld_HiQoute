/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("customers");
  collection.listRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.viewRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.deleteRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("customers");
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = "";
  collection.updateRule = "";
  collection.deleteRule = "";
  return app.save(collection);
})