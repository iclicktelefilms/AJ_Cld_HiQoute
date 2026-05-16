/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.listRule = "id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.viewRule = "id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.updateRule = "id = @request.auth.id || @request.auth.role = 'super_admin'";
  collection.deleteRule = "id = @request.auth.id || @request.auth.role = 'super_admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.listRule = "id = @request.auth.id";
  collection.viewRule = "id = @request.auth.id";
  collection.updateRule = "id = @request.auth.id";
  collection.deleteRule = "id = @request.auth.id";
  return app.save(collection);
})