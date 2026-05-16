/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("universal_packages");

  const existing = collection.fields.getByName("baseAmount");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("baseAmount"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "baseAmount",
    required: true,
    min: 0
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("universal_packages");
  collection.fields.removeByName("baseAmount");
  return app.save(collection);
})