/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("referrals");

  const existing = collection.fields.getByName("upgraded_users_count");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("upgraded_users_count"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "upgraded_users_count",
    required: true,
    min: 0
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("referrals");
  collection.fields.removeByName("upgraded_users_count");
  return app.save(collection);
})