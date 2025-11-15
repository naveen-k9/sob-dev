# npx expo start --dev-client

# npx eas build -p android --profile preview --local

cd android
./gradlew clean
cd ..

npx expo prebuild --clean

npx expo run:android

# npm run build && firebase deploy --only functions:verifyWhatsAppOTP,functions:createCustomToken

# firebase functions:log --only sendWhatsAppOTP

app/build.gradle (dependencies)
implementation project(':react-native-razorpay')

AndroidManifest.xml (above activity) <meta-data android:name="com.google.android.geo.API_KEY" android:value="AIzaSyAz5QXMfoHQLZ_ZpWWqE_7OUrAIaYPSmi4"/>


To refresh the Gradle cache
./gradlew clean



banners
heroImage
PolygonMap admin side
hide screens
now package into apk
