import * as admin from 'firebase-admin';

// Initialize firebase admin SDK
admin.initializeApp({
	credential: admin.credential.cert('./firebaseCredentials.json'),
	storageBucket: 'auth-development-25425.appspot.com'
});

// Cloud storage
const bucket = admin.storage().bucket();

export const UploadFileToBucket = async (file: Express.Multer.File, folder: string, uploadedFileName: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		let newFileName = `${folder}/${uploadedFileName}`;
		let fileUpload = bucket.file(newFileName);
		const writeStream = fileUpload.createWriteStream({
			public: true,
			metadata: {
				contentType: file.mimetype
			}
		});
		writeStream.on('error', (error) => {
			reject('Something is wrong! Unable to upload at the moment.');
		});
		writeStream.on('finish', () => {
			const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
			resolve(publicUrl);
		});
		writeStream.end(file.buffer);
	});
};

export const DeleteFile = async (imageUrl: string) => {
	const cleanedUrl = imageUrl.replace('https://storage.googleapis.com/auth-development-25425.appspot.com/', '').split('?')[0];
	const existingFile = bucket.file(cleanedUrl);
	await existingFile.delete();
};

export default {
	admin,
	bucket
};
