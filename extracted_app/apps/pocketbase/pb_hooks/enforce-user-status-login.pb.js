/// <reference path="../pb_data/types.d.ts" />
onRecordAuthRequest((e) => {
  // Check if user status is 'inactive' and prevent login
  const userStatus = e.record.get("status");
  if (userStatus === "inactive") {
    throw new BadRequestError("Your account is inactive. Please contact support.");
  }
  e.next();
}, "users");