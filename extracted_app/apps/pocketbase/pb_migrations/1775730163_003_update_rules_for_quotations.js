/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  collection.viewRule = "short_id != '' || user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  collection.viewRule = "user_id = @request.auth.id || @request.auth.role = 'super_admin'";
  return app.save(collection);
})