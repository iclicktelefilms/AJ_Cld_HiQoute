/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_quotations_quotationNumber"));
  collection.indexes.push("CREATE UNIQUE INDEX idx_quotations_user_quotationNumber ON quotations (user_id, quotationNumber)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("quotations");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_quotations_user_quotationNumber"));
  collection.indexes.push("CREATE UNIQUE INDEX idx_quotations_quotationNumber ON quotations (quotationNumber)");
  return app.save(collection);
})