/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  
  // Step 1: Find all duplicate phone numbers
  const records = arrayOf(new DynamicModel(app.findCollectionByNameOrId("users")));
  app.findAllRecords("users", 1000, 0, records);
  
  // Step 2: Group records by phone number
  const phoneMap = {};
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const phone = record.getString("phone");
    
    // Skip empty phone values
    if (phone === "") {
      continue;
    }
    
    if (!phoneMap[phone]) {
      phoneMap[phone] = [];
    }
    phoneMap[phone].push(record);
  }
  
  // Step 3: For each duplicate phone, keep the first and clear the rest
  for (const phone in phoneMap) {
    const duplicates = phoneMap[phone];
    
    // If there are duplicates (more than 1 record with same phone)
    if (duplicates.length > 1) {
      // Keep the first record, clear phone for the rest
      for (let i = 1; i < duplicates.length; i++) {
        const record = duplicates[i];
        record.set("phone", "");
        app.save(record);
      }
    }
  }
  
  // Step 4: Create the unique index on phone field (only for non-empty values)
  // The WHERE clause allows multiple empty/null phone values to coexist
  collection.indexes.push("CREATE UNIQUE INDEX idx_users_phone ON users (phone) WHERE phone != ''");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_users_phone"));
  return app.save(collection);
})