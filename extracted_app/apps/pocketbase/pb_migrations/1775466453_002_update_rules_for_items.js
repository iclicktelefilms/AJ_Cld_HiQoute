/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("items");
  collection.createRule = "@request.auth.id != '' && (@request.auth.role = 'photographer' || @request.auth.role = 'super_admin')";
  collection.updateRule = "@request.auth.id != '' && (@request.auth.role = 'photographer' || @request.auth.role = 'super_admin')";
  collection.deleteRule = "@request.auth.id != '' && (@request.auth.role = 'photographer' || @request.auth.role = 'super_admin')";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("items");
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "@request.auth.id != ''";
  collection.deleteRule = "@request.auth.id != ''";
  return app.save(collection);
})