/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const pbc_5937332521Collection = app.findCollectionByNameOrId("pbc_5937332521");
  const collection = app.findCollectionByNameOrId("packages");

  const existing = collection.fields.getByName("terms");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("terms"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "terms",
    collectionId: pbc_5937332521Collection.id
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("packages");
  collection.fields.removeByName("terms");
  return app.save(collection);
})