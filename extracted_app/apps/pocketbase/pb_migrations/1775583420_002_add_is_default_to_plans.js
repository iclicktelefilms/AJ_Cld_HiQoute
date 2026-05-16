/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("plans");

  const existing = collection.fields.getByName("is_default");
  if (existing) {
    if (existing.type === "bool") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("is_default"); // exists with wrong type, remove first
  }

  collection.fields.add(new BoolField({
    name: "is_default",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("plans");
  collection.fields.removeByName("is_default");
  return app.save(collection);
})