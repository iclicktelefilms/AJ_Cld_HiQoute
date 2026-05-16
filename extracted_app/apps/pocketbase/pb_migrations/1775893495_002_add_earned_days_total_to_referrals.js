/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("referrals");

  const existing = collection.fields.getByName("earned_days_total");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("earned_days_total"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "earned_days_total",
    required: true,
    min: 0
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("referrals");
  collection.fields.removeByName("earned_days_total");
  return app.save(collection);
})