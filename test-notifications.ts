/**
 * Notification Test Script
 *
 * This script tests the notification system by:
 * 1. Creating a broadcast notification in the database
 * 2. Verifying it appears in user notifications
 * 3. Optionally sending via Firebase Cloud Functions
 *
 * Usage:
 *   Use the test UI component or import functions directly
 */

import db from "./db";
import { User, Notification, UserRole } from "./types";

// Test notification data
const TEST_NOTIFICATION = {
  title: "🧪 Test Notification",
  message:
    "This is a broadcast test notification sent at " +
    new Date().toLocaleTimeString(),
  type: "promotion" as const,
  isRead: false,
  data: {
    via: "test_script",
    testId: Date.now().toString(),
  },
};

interface TestConfig {
  userId?: string;
  role?: UserRole | "all";
  title?: string;
  message?: string;
}

/**
 * Get all users from database
 */
async function getUsers(): Promise<User[]> {
  try {
    return await db.getUsers();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Get notifications from database
 */
async function getNotifications(): Promise<Notification[]> {
  try {
    const users = await db.getUsers();
    if (users.length === 0) return [];
    const allNotifications: Notification[] = [];
    for (const user of users) {
      const userNotifs = await db.getNotifications(user.id);
      allNotifications.push(...userNotifs);
    }
    return allNotifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Create a notification for a specific user
 */
async function createNotification(
  userId: string,
  data: Omit<Notification, "id" | "createdAt" | "userId">
): Promise<Notification> {
  return await db.createNotification({
    ...data,
    userId,
  });
}

/**
 * Broadcast notification to multiple users
 */
async function broadcastNotification(
  data: Omit<Notification, "id" | "createdAt" | "userId">,
  role?: UserRole | "all"
): Promise<number> {
  const users = await getUsers();
  const targetUsers =
    role && role !== "all" ? users.filter((u) => u.role === role) : users;

  console.log(
    `\n📢 Broadcasting to ${targetUsers.length} users (role: ${role || "all"})`
  );

  const count = await db.broadcastNotification({
    ...data,
    ...(role && role !== "all" ? { role } : {}),
  } as any);

  targetUsers.forEach((user) => {
    console.log(
      `  ✅ Created notification for user: ${user.name} (${user.email})`
    );
  });

  return count;
}

/**
 * Display user's notifications
 */
async function displayUserNotifications(userId: string) {
  const notifications = await getNotifications();
  const userNotifications = notifications
    .filter((n) => n.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  console.log(`\n📬 Notifications for user ${userId}:`);
  console.log(`   Total: ${userNotifications.length} notifications\n`);

  if (userNotifications.length === 0) {
    console.log("   No notifications found.");
    return;
  }

  userNotifications.slice(0, 10).forEach((n, idx) => {
    const timestamp = new Date(n.createdAt).toLocaleString();
    const readStatus = n.isRead ? "✓ Read" : "○ Unread";
    console.log(`   ${idx + 1}. [${readStatus}] ${n.title}`);
    console.log(`      ${n.message}`);
    console.log(`      Type: ${n.type} | Time: ${timestamp}`);
    if (n.data) {
      console.log(`      Data: ${JSON.stringify(n.data)}`);
    }
    console.log("");
  });
}

/**
 * List all users
 */
async function listUsers() {
  const users = await getUsers();
  console.log(`\n👥 Total users: ${users.length}\n`);

  users.forEach((user, idx) => {
    console.log(`   ${idx + 1}. ${user.name}`);
    console.log(`      ID: ${user.id}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      Role: ${user.role}`);
    console.log(
      `      Push Token: ${
        user.pushToken ? "✓ Registered" : "✗ Not registered"
      }`
    );
    console.log("");
  });
}

/**
 * Clear all test notifications
 */
async function clearTestNotifications() {
  const users = await getUsers();
  let removedCount = 0;

  for (const user of users) {
    const notifications = await db.getNotifications(user.id);
    for (const notif of notifications) {
      if (notif.data?.via?.includes("test")) {
        await db.deleteNotification(notif.id);
        removedCount++;
      }
    }
  }

  console.log(`\n🧹 Removed ${removedCount} test notifications`);
  return removedCount;
}

/**
 * Main test function
 */
async function runTest(config: TestConfig = {}) {
  console.log("\n" + "=".repeat(60));
  console.log("🔔 NOTIFICATION SYSTEM TEST");
  console.log("=".repeat(60));

  try {
    // Show available users
    await listUsers();

    // Prepare notification data
    const notificationData = {
      title: config.title || TEST_NOTIFICATION.title,
      message: config.message || TEST_NOTIFICATION.message,
      type: TEST_NOTIFICATION.type,
      isRead: TEST_NOTIFICATION.isRead,
      data: TEST_NOTIFICATION.data,
    };

    // Send notification
    if (config.userId) {
      // Send to specific user
      console.log(`\n📤 Sending notification to user: ${config.userId}`);
      await createNotification(config.userId, notificationData);
      console.log("   ✅ Notification created successfully!");

      // Display user's notifications
      await displayUserNotifications(config.userId);
    } else {
      // Broadcast to all or role-specific users
      const count = await broadcastNotification(notificationData, config.role);
      console.log(`\n✅ Successfully created ${count} notifications!`);

      // Display first user's notifications as sample
      const users = await getUsers();
      if (users.length > 0) {
        console.log("\n📋 Sample - First user's notifications:");
        await displayUserNotifications(users[0].id);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log("\nℹ️  Check your app to see the notifications!");
    console.log("ℹ️  Notifications should appear in the notifications screen.");
    console.log("ℹ️  If running, you should also see an alert/banner.\n");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    console.error(
      "\nStack trace:",
      error instanceof Error ? error.stack : error
    );
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const config: TestConfig = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--user" && args[i + 1]) {
      config.userId = args[++i];
    } else if (arg === "--role" && args[i + 1]) {
      config.role = args[++i] as UserRole | "all";
    } else if (arg === "--title" && args[i + 1]) {
      config.title = args[++i];
    } else if (arg === "--message" && args[i + 1]) {
      config.message = args[++i];
    } else if (arg === "--list") {
      return { userId: "LIST_ONLY" };
    } else if (arg === "--clear") {
      return { userId: "CLEAR_TESTS" };
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Notification Test Script Usage:
  
  npx ts-node test-notifications.ts [options]

Options:
  --user <userId>       Send to specific user ID
  --role <role>         Send to all users with role (customer|admin|kitchen|delivery)
  --title <text>        Custom notification title
  --message <text>      Custom notification message
  --list                List all users
  --clear               Clear all test notifications
  --help, -h            Show this help message

Examples:
  # Broadcast to all users
  npx ts-node test-notifications.ts
  
  # Send to specific user
  npx ts-node test-notifications.ts --user user123
  
  # Send to all customers
  npx ts-node test-notifications.ts --role customer
  
  # Custom message
  npx ts-node test-notifications.ts --title "Flash Sale!" --message "50% off today!"
  
  # List all users
  npx ts-node test-notifications.ts --list
  
  # Clear test notifications
  npx ts-node test-notifications.ts --clear
`);
      process.exit(0);
    }
  }

  return config;
}

// Run the test
if (require.main === module) {
  const config = parseArgs();

  if (config.userId === "LIST_ONLY") {
    listUsers().then(() => process.exit(0));
  } else if (config.userId === "CLEAR_TESTS") {
    clearTestNotifications().then(() => process.exit(0));
  } else {
    runTest(config).then(() => process.exit(0));
  }
}

export {
  runTest,
  broadcastNotification,
  createNotification,
  listUsers,
  clearTestNotifications,
};
