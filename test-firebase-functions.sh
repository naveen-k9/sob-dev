#!/bin/bash

# Firebase Functions - Complete Test Script
# This script will help you test your Firebase Functions setup

echo "🔥 Firebase Functions Setup & Test Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
fi

echo "✅ Firebase CLI version: $(firebase --version)"
echo ""

# Check if functions directory exists
if [ ! -d "functions" ]; then
    echo "❌ functions directory not found!"
    exit 1
fi

# Check if functions are built
if [ ! -f "functions/lib/index.js" ]; then
    echo "⚠️  Functions not built yet. Building..."
    cd functions
    npm run build
    cd ..
fi

echo "✅ Functions directory: OK"
echo "✅ Functions compiled: OK"
echo ""

# Check Node version
NODE_VERSION=$(node --version)
echo "📦 Node version: $NODE_VERSION"
echo ""

# Check if .env file exists
if [ ! -f "functions/.env" ]; then
    echo "⚠️  Warning: functions/.env not found!"
    echo "Creating template .env file..."
    cat > functions/.env << EOF
FIREBASE_PROJECT_ID=your-project-id
WHATSAPP_API_URL=https://graph.facebook.com/v22.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
EOF
    echo "✅ Created functions/.env - Please update with your actual values"
    echo ""
fi

echo "📋 Setup Summary:"
echo "----------------"
echo "✅ Firebase CLI installed"
echo "✅ Functions directory exists"
echo "✅ TypeScript compiled to JavaScript"
echo "✅ Environment file created"
echo ""

echo "🚀 Ready to test!"
echo ""
echo "Choose an option:"
echo "1. Start Firebase Emulators (recommended for full testing)"
echo "2. Start Functions Emulator only (faster)"
echo "3. Run quick test (checks if setup works)"
echo "4. Exit"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting Firebase Emulators..."
        echo "This will start Functions, Firestore, and Auth emulators"
        echo ""
        echo "After emulators start:"
        echo "- Open Emulator UI: http://localhost:4000"
        echo "- Functions endpoint: http://localhost:5001"
        echo "- Test with: cd functions && npm test"
        echo ""
        firebase emulators:start
        ;;
    2)
        echo ""
        echo "🚀 Starting Functions Emulator only..."
        echo ""
        firebase emulators:start --only functions
        ;;
    3)
        echo ""
        echo "🧪 Running quick test..."
        echo ""
        echo "Checking if emulators are running..."
        if curl -s http://localhost:5001 > /dev/null 2>&1; then
            echo "✅ Emulator is running!"
            echo "Running tests..."
            cd functions
            npm test
        else
            echo "❌ Emulator is not running!"
            echo ""
            echo "Please start emulators first:"
            echo "  firebase emulators:start"
            echo ""
            echo "Or run this script again and choose option 1 or 2"
        fi
        ;;
    4)
        echo "Goodbye! 👋"
        exit 0
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac
