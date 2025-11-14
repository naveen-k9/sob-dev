# npx expo start --dev-client

# npx eas build -p android --profile preview --local

cd android
./gradlew clean
cd ..

npx expo prebuild --clean

npx expo run:android

npm run build && firebase deploy --only functions:verifyWhatsAppOTP,functions:createCustomToken

# firebase functions:log --only sendWhatsAppOTP