/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("universal_items");
  collection.listRule = "";
  collection.viewRule = "";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("universal_items");
  collection.listRule = "@request.auth.role = \"super_admin\"";
  collection.viewRule = "@request.auth.role = \"super_admin\"";
  return app.save(collection);
})