/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("settings");

  const existing = collection.fields.getByName("whatsapp_message_template");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("whatsapp_message_template"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "whatsapp_message_template",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("settings");
  collection.fields.removeByName("whatsapp_message_template");
  return app.save(collection);
})