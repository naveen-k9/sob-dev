const { createRunOncePlugin, withAppBuildGradle, withProjectBuildGradle } = require("@expo/config-plugins");

const RAZORPAY_MAVEN_REPO = "https://maven.razorpay.com";
const RAZORPAY_REPO_PATTERN = /maven\s*\{\s*url\s*['"]https:\/\/maven\.razorpay\.com\/?['"]\s*\}/;

function addRazorpayRepoIfMissing(gradleContents) {
  if (RAZORPAY_REPO_PATTERN.test(gradleContents)) {
    return gradleContents;
  }

  const allProjectsRepositoriesPattern = /(allprojects\s*\{\s*repositories\s*\{)/m;
  if (allProjectsRepositoriesPattern.test(gradleContents)) {
    return gradleContents.replace(
      allProjectsRepositoriesPattern,
      `$1\n    maven { url '${RAZORPAY_MAVEN_REPO}' }`
    );
  }

  const settingsRepositoriesPattern = /(dependencyResolutionManagement\s*\{\s*repositories\s*\{)/m;
  if (settingsRepositoriesPattern.test(gradleContents)) {
    return gradleContents.replace(
      settingsRepositoriesPattern,
      `$1\n    maven { url '${RAZORPAY_MAVEN_REPO}' }`
    );
  }

  throw new Error(
    "Unable to add Razorpay Maven repository. Could not find a Gradle repositories block."
  );
}

function addRazorpayDependencyIfMissing(appBuildGradleContents) {
  const dependencyLine = "    implementation project(':react-native-razorpay')";
  if (appBuildGradleContents.includes(dependencyLine)) {
    return appBuildGradleContents;
  }

  const dependenciesBlockPattern = /(dependencies\s*\{)/m;
  if (dependenciesBlockPattern.test(appBuildGradleContents)) {
    return appBuildGradleContents.replace(
      dependenciesBlockPattern,
      `$1\n${dependencyLine}`
    );
  }

  throw new Error(
    "Unable to add Razorpay dependency. Could not find dependencies block in app/build.gradle."
  );
}

const withRazorpay = (config) => {
  const withRepo = withProjectBuildGradle(config, (configWithBuildGradle) => {
    const contents = configWithBuildGradle.modResults.contents;
    configWithBuildGradle.modResults.contents = addRazorpayRepoIfMissing(contents);
    return configWithBuildGradle;
  });

  return withAppBuildGradle(withRepo, (configWithAppBuildGradle) => {
    const contents = configWithAppBuildGradle.modResults.contents;
    configWithAppBuildGradle.modResults.contents = addRazorpayDependencyIfMissing(contents);
    return configWithAppBuildGradle;
  });
};

module.exports = createRunOncePlugin(withRazorpay, "with-razorpay", "1.0.0");
