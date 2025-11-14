const admin = require('firebase-admin');
const serviceAccount = require('./functions/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testOTPWrite() {
    try {
        console.log('Testing OTP write to Firestore...');

        const testPhone = '+919876543210';
        const otp = '123456';
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        await db.collection('otps').doc(testPhone).set({
            otp,
            expiresAt: otpExpiry,
            createdAt: Date.now(),
        });

        console.log('✅ OTP written successfully!');

        // Read it back
        const doc = await db.collection('otps').doc(testPhone).get();
        console.log('Read back:', doc.exists, doc.data());

        // Clean up
        await db.collection('otps').doc(testPhone).delete();
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Error:', error);
    }

    process.exit(0);
}

testOTPWrite();
