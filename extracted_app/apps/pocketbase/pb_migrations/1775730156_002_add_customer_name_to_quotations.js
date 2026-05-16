/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("quotations");

  const existing = collection.fields.getByName("customer_name");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("customer_name"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "customer_name"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  collection.fields.removeByName("customer_name");
  return app.save(collection);
})