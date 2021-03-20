
const admin = require('firebase-admin')

// Initialize firebase admin SDK
admin.initializeApp({
	credential: admin.credential.cert("./auth-development-25425-firebase-adminsdk-wpx5f-578f9f8761.json"),
	storageBucket: "auth-development-25425.appspot.com"
});

// Cloud storage
const bucket = admin.storage().bucket()

export default {
	bucket
}