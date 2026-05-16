/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("plans");
  collection.listRule = "@request.auth.id != ''";
  collection.viewRule = "@request.auth.id != ''";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("plans");
  collection.listRule = "@request.auth.role = 'super_admin'";
  collection.viewRule = "@request.auth.role = 'super_admin'";
  return app.save(collection);
})