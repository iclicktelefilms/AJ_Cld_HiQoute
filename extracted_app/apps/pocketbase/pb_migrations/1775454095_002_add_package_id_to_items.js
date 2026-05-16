/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const packagesCollection = app.findCollectionByNameOrId("packages");
  const collection = app.findCollectionByNameOrId("items");

  const existing = collection.fields.getByName("package_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("package_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "package_id",
    required: false,
    collectionId: packagesCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("items");
  collection.fields.removeByName("package_id");
  return app.save(collection);
})