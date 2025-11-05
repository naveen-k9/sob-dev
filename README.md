# npx expo start --dev-client

# npx eas build -p android --profile preview --local

cd android
./gradlew clean
cd ..

npx expo prebuild --clean

npx expo run:android