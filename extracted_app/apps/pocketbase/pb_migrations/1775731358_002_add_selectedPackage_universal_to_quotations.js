/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const universal_packagesCollection = app.findCollectionByNameOrId("universal_packages");
  const collection = app.findCollectionByNameOrId("quotations");

  const existing = collection.fields.getByName("selectedPackage_universal");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("selectedPackage_universal"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "selectedPackage_universal",
    collectionId: universal_packagesCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  collection.fields.removeByName("selectedPackage_universal");
  return app.save(collection);
})