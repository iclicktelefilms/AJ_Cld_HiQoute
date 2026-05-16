/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("packages");

  const existing = collection.fields.getByName("discount");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("discount"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "discount"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("packages");
  collection.fields.removeByName("discount");
  return app.save(collection);
})