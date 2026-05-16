/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("user_plans");
  const field = collection.fields.getByName("expiry_date");
  field.required = true;
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("user_plans");
  const field = collection.fields.getByName("expiry_date");
  field.required = false;
  return app.save(collection);
})