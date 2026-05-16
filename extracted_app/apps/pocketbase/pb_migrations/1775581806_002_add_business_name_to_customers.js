/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("customers");

  const existing = collection.fields.getByName("business_name");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("business_name"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "business_name",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("customers");
  collection.fields.removeByName("business_name");
  return app.save(collection);
})