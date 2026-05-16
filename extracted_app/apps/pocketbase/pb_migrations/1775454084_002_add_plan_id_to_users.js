/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const plansCollection = app.findCollectionByNameOrId("plans");
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("plan_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("plan_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "plan_id",
    required: false,
    collectionId: plansCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("plan_id");
  return app.save(collection);
})