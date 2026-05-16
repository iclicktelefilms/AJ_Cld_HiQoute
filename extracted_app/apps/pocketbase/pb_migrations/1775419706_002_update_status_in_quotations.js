/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  const field = collection.fields.getByName("status");
  field.values = ["draft", "sent", "accepted", "rejected", "cancelled"];
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  const field = collection.fields.getByName("status");
  field.values = ["draft", "sent"];
  return app.save(collection);
})