/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("customers");

  const existing = collection.fields.getByName("instagramProfile");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("instagramProfile"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "instagramProfile",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("customers");
  collection.fields.removeByName("instagramProfile");
  return app.save(collection);
})