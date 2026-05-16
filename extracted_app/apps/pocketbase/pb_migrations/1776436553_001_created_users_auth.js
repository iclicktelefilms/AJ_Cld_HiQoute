/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    let plansCollection = app.findCollectionByNameOrId("plans")
    let usersCollection = app.findCollectionByNameOrId("users")
    let collection = new Collection({
        type: "auth",
        name: "users",
        listRule: "id = @request.auth.id || @request.auth.role = 'super_admin'",
        viewRule: "id = @request.auth.id || @request.auth.role = 'super_admin'",
        createRule: "",
        updateRule: "id = @request.auth.id || @request.auth.role = 'super_admin'",
        deleteRule: "@request.auth.role = 'super_admin'",
        fields: [
        {
                "hidden": false,
                "id": "text8571276723",
                "name": "name",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "file1950862856",
                "name": "avatar",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "file",
                "maxSelect": 1,
                "maxSize": 20971520,
                "mimeTypes": [
                        "image/jpeg",
                        "image/png",
                        "image/svg+xml",
                        "image/gif",
                        "image/webp"
                ],
                "thumbs": []
        },
        {
                "hidden": false,
                "id": "file6082111636",
                "name": "profile_picture",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "file",
                "maxSelect": 1,
                "maxSize": 5242880,
                "mimeTypes": [],
                "thumbs": []
        },
        {
                "hidden": false,
                "id": "text1503593291",
                "name": "full_name",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "text0454537493",
                "name": "phone",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": "^[0-9]{10}$"
        },
        {
                "hidden": false,
                "id": "text5888445894",
                "name": "business_name",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "text6158821389",
                "name": "location",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "text0901716819",
                "name": "bio",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "select8045506283",
                "name": "role",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                        "photographer",
                        "super_admin"
                ]
        },
        {
                "hidden": false,
                "id": "bool2961173588",
                "name": "is_super_admin",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "bool"
        },
        {
                "hidden": false,
                "id": "relation6882926595",
                "name": "plan_id",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                collectionId: plansCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
        },
        {
                "hidden": false,
                "id": "select2836058870",
                "name": "status",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                        "active",
                        "inactive"
                ]
        },
        {
                "hidden": false,
                "id": "text8045080903",
                "name": "referralCode",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "relation9177143338",
                "name": "referredBy",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                collectionId: usersCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
        },
        {
                "hidden": false,
                "id": "bool5596114740",
                "name": "referralRewardGiven",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "bool"
        },
        {
                "hidden": false,
                "id": "text9647708074",
                "name": "instagramProfile",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "bool2626108815",
                "name": "onboarding_completed",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "bool"
        },
        {
                "hidden": false,
                "id": "text2949120339",
                "name": "address",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "text3804767265",
                "name": "referral_code",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "relation8344783267",
                "name": "referred_by",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                collectionId: usersCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
        }
],
        authAlert: { enabled: false },
    })

    try {
        app.save(collection)
    } catch (e) {
        if (e.message.includes("Collection name must be unique")) {
            console.log("Collection already exists, skipping")
            return
        }
        throw e
    }
}, (app) => {
    try {
        // Remove relation fields from dependent collections before deleting users collection
        const dependentCollections = ["items", "packages", "terms"]
        
        for (const collectionName of dependentCollections) {
            try {
                let collection = app.findCollectionByNameOrId(collectionName)
                
                // Find and remove user_id relation field by filtering it out
                const newFields = []
                for (let i = 0; i < collection.fields.length; i++) {
                    const field = collection.fields[i]
                    // Keep all fields except user_id relation fields
                    if (field.name !== "user_id" || field.type !== "relation") {
                        newFields.push(field)
                    }
                }
                
                // Update the collection with the filtered fields
                collection.fields = newFields
                app.save(collection)
            } catch (e) {
                // Collection might not exist, continue
                console.log("Could not update collection " + collectionName + ": " + e.message)
            }
        }
        
        // Now delete the users collection
        let collection = app.findCollectionByNameOrId("users")
        app.delete(collection)
    } catch (e) {
        if (e.message.includes("no rows in result set")) {
            console.log("Collection not found, skipping revert");
            return;
        }
        throw e;
    }
})