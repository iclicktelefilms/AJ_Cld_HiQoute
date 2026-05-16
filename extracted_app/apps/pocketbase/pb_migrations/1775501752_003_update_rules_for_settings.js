/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("settings");
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = "@request.auth.role = \"super_admin\"";
  collection.updateRule = "@request.auth.role = \"super_admin\"";
  collection.deleteRule = "@request.auth.role = \"super_admin\"";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("settings");
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = "";
  collection.updateRule = "";
  collection.deleteRule = "";
  return app.save(collection);
})