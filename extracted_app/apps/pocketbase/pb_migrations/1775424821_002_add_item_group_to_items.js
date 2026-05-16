/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("items");

  const existing = collection.fields.getByName("item_group");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("item_group"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "item_group",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("items");
  collection.fields.removeByName("item_group");
  return app.save(collection);
})