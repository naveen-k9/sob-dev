#!/bin/bash

# Notification Test Script for SameOldBox
# This script helps test the notification system

echo "================================================"
echo "🔔 SameOldBox Notification Test Script"
echo "================================================"
echo ""

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to show menu
show_menu() {
    echo ""
    echo "Select an option:"
    echo "1) Send test broadcast notification to all users"
    echo "2) Send test notification to customers only"
    echo "3) Send test notification to admins only"
    echo "4) List all users"
    echo "5) Clear test notifications"
    echo "6) View recent notifications"
    echo "7) Open test UI in app"
    echo "8) Exit"
    echo ""
    read -p "Enter your choice (1-8): " choice
}

# Function to send broadcast
send_broadcast() {
    local role=$1
    local title="🧪 Test Notification - $(date '+%H:%M:%S')"
    local message="This is a test broadcast notification sent at $(date)"
    
    echo ""
    echo "📤 Sending notification..."
    echo "   Title: $title"
    echo "   Message: $message"
    echo "   Target: $role"
    echo ""
    
    # Here you would call your notification API or function
    # For now, we'll show how to open the React Native app to the test screen
    echo "✅ To send notifications, please:"
    echo "   1. Open your app"
    echo "   2. Navigate to Admin > Test Notifications"
    echo "   3. Use the UI to send test notifications"
    echo ""
    echo "Or use the REST API:"
    echo "   curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/sendPromotionalNotification \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"title\":\"$title\",\"message\":\"$message\",\"role\":\"$role\"}'"
}

# Function to list users
list_users() {
    echo ""
    echo "👥 To view all users:"
    echo "   1. Open your app"
    echo "   2. Navigate to Admin > Test Notifications"
    echo "   3. Click 'List Users' button"
    echo ""
    echo "Or check Firebase Console:"
    echo "   https://console.firebase.google.com/project/YOUR_PROJECT/firestore/data/users"
}

# Function to open app
open_test_ui() {
    echo ""
    echo "🚀 Opening app..."
    echo ""
    echo "Please navigate to: Admin > Test Notifications"
    echo ""
    echo "If app is not running, start it with:"
    echo "   npx expo start"
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1)
            send_broadcast "all"
            ;;
        2)
            send_broadcast "customer"
            ;;
        3)
            send_broadcast "admin"
            ;;
        4)
            list_users
            ;;
        5)
            echo ""
            echo "🧹 To clear test notifications:"
            echo "   1. Open your app"
            echo "   2. Navigate to Admin > Test Notifications"
            echo "   3. Click 'Clear Tests' button"
            ;;
        6)
            echo ""
            echo "📬 To view recent notifications:"
            echo "   1. Open your app"
            echo "   2. Navigate to Notifications screen"
            echo "   3. Check for test notifications (marked with 🧪)"
            ;;
        7)
            open_test_ui
            ;;
        8)
            echo ""
            echo "👋 Goodbye!"
            echo ""
            exit 0
            ;;
        *)
            echo ""
            echo "❌ Invalid choice. Please enter a number between 1 and 8."
            ;;
    esac
    
    read -p "Press Enter to continue..."
done
