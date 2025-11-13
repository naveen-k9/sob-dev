import "dotenv/config";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin with service account for local testing
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? await import(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : undefined;

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
} else {
    admin.initializeApp();
}

// Test function to verify setup
exports.testFunction = functions.https.onRequest((req, res) => {
    console.log("Test function called!");
    res.json({
        success: true,
        message: "Firebase Functions local testing is working!",
        timestamp: new Date().toISOString(),
        env: {
            projectId: process.env.FIREBASE_PROJECT_ID,
            hasWhatsAppConfig: !!process.env.WHATSAPP_ACCESS_TOKEN
        }
    });
});

// Test callable function
exports.testCallable = functions.https.onCall((data, context) => {
    console.log("Test callable function called with data:", data);
    return {
        success: true,
        message: `Hello ${data.name || "World"}!`,
        receivedData: data,
        uid: context.auth?.uid || "anonymous"
    };
});

// Test Firestore trigger
exports.testFirestoreTrigger = functions.firestore
    .document("test/{docId}")
    .onCreate((snap, context) => {
        const data = snap.data();
        console.log("New test document created:", context.params.docId, data);
        return null;
    });

console.log("Local test functions loaded successfully!");
