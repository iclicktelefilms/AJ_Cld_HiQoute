/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("plans");

  const record0 = new Record(collection);
    record0.set("name", "Trial");
    record0.set("price", 0.01);
    record0.set("features", "Unlimited quotations, Unlimited customers, Unlimited packages, Unlimited items, PDF generation, Public quotation view link, Quotation status tracking, Analytics dashboard, Refer and earn, and more");
    record0.set("status", "active");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})