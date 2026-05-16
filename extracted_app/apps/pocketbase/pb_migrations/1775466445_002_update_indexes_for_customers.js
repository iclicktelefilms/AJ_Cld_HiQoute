/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("customers");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_customers_phone"));
  collection.indexes.push("CREATE UNIQUE INDEX idx_customers_user_phone ON customers (user_id, phone)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("customers");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_customers_user_phone"));
  collection.indexes.push("CREATE UNIQUE INDEX idx_customers_phone ON customers (phone)");
  return app.save(collection);
})