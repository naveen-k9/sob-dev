const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  // Don't hard-fail config evaluation (EAS/CI reads this file just to parse config).
  // When building for stores, set this via EAS secrets/env so native Google Maps works.
  console.warn(
    "Google Maps API key missing. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY to enable native maps configuration."
  );
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: "SameOldBox",
  slug: "sameoldbox",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "app",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sameoldbox.app",
    ...(GOOGLE_MAPS_API_KEY
      ? {
          config: {
            googleMapsApiKey: GOOGLE_MAPS_API_KEY,
          },
        }
      : {}),
    infoPlist: {
      NSLocationAlwaysAndWhenInUseUsageDescription: "Allow $(PRODUCT_NAME) to use your location.",
      NSLocationAlwaysUsageDescription: "Allow $(PRODUCT_NAME) to use your location.",
      NSLocationWhenInUseUsageDescription: "Allow $(PRODUCT_NAME) to use your location.",
      UIBackgroundModes: ["location", "remote-notification"],
    },
    entitlements: {
      "aps-environment": "production",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.sameoldbox.app",
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
    ],
    googleServicesFile: "./google-services.json",
    ...(GOOGLE_MAPS_API_KEY
      ? {
          config: {
            googleMaps: {
              apiKey: GOOGLE_MAPS_API_KEY,
            },
          },
        }
      : {}),
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    [
      "expo-router",
      {
        origin: "https://sameoldbox.com/",
      },
    ],
    [
      "expo-location",
      {
        isAndroidForegroundServiceEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isIosBackgroundLocationEnabled: true,
        locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#ffffff",
        sounds: ["./assets/sounds/notification.wav"],
        mode: "production",
      },
    ],
    "./plugins/withRazorpay",
    "expo-font",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
  },
  updates: {
    enabled: true,
  },
  runtimeVersion: "1.0.0",
  extra: {
    router: {
      origin: "https://sameoldbox.com/",
    },
    eas: {
      projectId: "a779688a-33bb-4223-90fd-7a3629c84755",
    },
  },
  owner: "sameoldboxexpo",
};
