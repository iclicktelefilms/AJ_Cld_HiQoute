/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("universal_packages");

  const existing = collection.fields.getByName("adjustment");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("adjustment"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "adjustment",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("universal_packages");
  collection.fields.removeByName("adjustment");
  return app.save(collection);
})