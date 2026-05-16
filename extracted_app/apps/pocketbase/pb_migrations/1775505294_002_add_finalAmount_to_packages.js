/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("packages");

  const existing = collection.fields.getByName("finalAmount");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("finalAmount"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "finalAmount"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("packages");
  collection.fields.removeByName("finalAmount");
  return app.save(collection);
})