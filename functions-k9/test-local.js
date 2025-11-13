#!/usr/bin/env node

/**
 * Quick Test Script for Firebase Functions
 * Run this to verify your local setup is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID';

console.log('🚀 Firebase Functions Local Test\n');
console.log(`Testing against: ${BASE_URL}/${PROJECT_ID}/us-central1\n`);

async function testHttpFunction() {
    console.log('1️⃣  Testing HTTP Function...');
    try {
        const response = await axios.get(
            `${BASE_URL}/${PROJECT_ID}/us-central1/testFunction`
        );
        console.log('✅ HTTP Function Response:', response.data);
    } catch (error) {
        console.error('❌ HTTP Function Error:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
    console.log('');
}

async function testCallableFunction() {
    console.log('2️⃣  Testing Callable Function...');
    try {
        const response = await axios.post(
            `${BASE_URL}/${PROJECT_ID}/us-central1/testCallable`,
            {
                data: { name: 'Test User' }
            }
        );
        console.log('✅ Callable Function Response:', response.data);
    } catch (error) {
        console.error('❌ Callable Function Error:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
    console.log('');
}

async function runTests() {
    console.log('📋 Prerequisites:');
    console.log('   1. Firebase emulators must be running');
    console.log('   2. Run: firebase emulators:start');
    console.log('   3. Or: cd functions && npm run serve\n');

    console.log('⏳ Starting tests in 2 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    await testHttpFunction();
    await testCallableFunction();

    console.log('✨ Tests complete!');
    console.log('\n📊 Next steps:');
    console.log('   - Check emulator UI: http://localhost:4000');
    console.log('   - View logs in the terminal where emulators are running');
    console.log('   - Test production functions by updating .env and deploying');
}

// Check if emulator is running
axios.get(`${BASE_URL}/${PROJECT_ID}/us-central1/testFunction`)
    .then(() => runTests())
    .catch(error => {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Cannot connect to Firebase Emulator!');
            console.error('\n🔧 Start the emulator first:');
            console.error('   firebase emulators:start');
            console.error('   OR');
            console.error('   cd functions && npm run serve');
            process.exit(1);
        } else {
            runTests();
        }
    });
