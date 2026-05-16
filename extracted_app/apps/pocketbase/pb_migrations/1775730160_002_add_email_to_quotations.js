/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("quotations");

  const existing = collection.fields.getByName("email");
  if (existing) {
    if (existing.type === "email") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("email"); // exists with wrong type, remove first
  }

  collection.fields.add(new EmailField({
    name: "email"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  collection.fields.removeByName("email");
  return app.save(collection);
})