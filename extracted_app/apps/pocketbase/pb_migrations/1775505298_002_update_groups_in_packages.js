/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("packages");
  const field = collection.fields.getByName("groups");
  field.type = "json";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("packages");
  const field = collection.fields.getByName("groups");
  field.type = "text";
  return app.save(collection);
})