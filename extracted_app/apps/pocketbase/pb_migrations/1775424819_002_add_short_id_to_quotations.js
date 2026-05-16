/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("quotations");

  const existing = collection.fields.getByName("short_id");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("short_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "short_id",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  collection.fields.removeByName("short_id");
  return app.save(collection);
})