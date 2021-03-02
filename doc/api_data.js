define({ "api": [
  {
    "type": "get",
    "url": "/user/:id",
    "title": "Register user",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Must contain the Firebase token.</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name of the user.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email of the user.</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 400": [
          {
            "group": "Error 400",
            "optional": false,
            "field": "existing_id",
            "description": "<p>There is already a user with such an id.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controllers/userController.js",
    "groupTitle": "User",
    "name": "GetUserId"
  }
] });
