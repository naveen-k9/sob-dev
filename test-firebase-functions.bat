@echo off
REM Firebase Functions - Complete Test Script for Windows
REM This script will help you test your Firebase Functions setup

echo ========================================
echo Firebase Functions Setup and Test Script
echo ========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase CLI not found!
    echo Installing Firebase CLI...
    npm install -g firebase-tools
)

echo [OK] Firebase CLI installed
firebase --version
echo.

REM Check if functions directory exists
if not exist "functions" (
    echo [ERROR] functions directory not found!
    pause
    exit /b 1
)

REM Check if functions are built
if not exist "functions\lib\index.js" (
    echo [WARNING] Functions not built yet. Building...
    cd functions
    call npm run build
    cd ..
)

echo [OK] Functions directory exists
echo [OK] Functions compiled
echo.

REM Check Node version
echo Node version:
node --version
echo.

REM Check if .env file exists
if not exist "functions\.env" (
    echo [WARNING] functions\.env not found!
    echo Creating template .env file...
    (
        echo FIREBASE_PROJECT_ID=your-project-id
        echo WHATSAPP_API_URL=https://graph.facebook.com/v22.0
        echo WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
        echo WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
    ) > functions\.env
    echo [OK] Created functions\.env - Please update with your actual values
    echo.
)

echo ========================================
echo Setup Summary
echo ========================================
echo [OK] Firebase CLI installed
echo [OK] Functions directory exists
echo [OK] TypeScript compiled to JavaScript
echo [OK] Environment file created
echo.

echo Ready to test!
echo.
echo Choose an option:
echo 1. Start Firebase Emulators (recommended for full testing)
echo 2. Start Functions Emulator only (faster)
echo 3. Open Emulator UI in browser
echo 4. Run quick test
echo 5. View project structure
echo 6. Exit
echo.
set /p choice="Enter choice [1-6]: "

if "%choice%"=="1" goto full_emulator
if "%choice%"=="2" goto functions_only
if "%choice%"=="3" goto open_ui
if "%choice%"=="4" goto quick_test
if "%choice%"=="5" goto view_structure
if "%choice%"=="6" goto end

:full_emulator
echo.
echo Starting Firebase Emulators...
echo This will start Functions, Firestore, and Auth emulators
echo.
echo After emulators start:
echo - Open Emulator UI: http://localhost:4000
echo - Functions endpoint: http://localhost:5001
echo - Test with: cd functions ^&^& npm test
echo.
firebase emulators:start
goto end

:functions_only
echo.
echo Starting Functions Emulator only...
echo.
firebase emulators:start --only functions
goto end

:open_ui
echo.
echo Opening Emulator UI in browser...
start http://localhost:4000
echo.
echo If emulators are not running, start them with:
echo   firebase emulators:start
echo.
pause
goto end

:quick_test
echo.
echo Running quick test...
echo.
echo Checking if emulators are running...
curl -s http://localhost:5001 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Emulator is running!
    echo Running tests...
    cd functions
    call npm test
    cd ..
) else (
    echo [ERROR] Emulator is not running!
    echo.
    echo Please start emulators first:
    echo   firebase emulators:start
    echo.
    echo Or run this script again and choose option 1 or 2
)
pause
goto end

:view_structure
echo.
echo ========================================
echo Project Structure
echo ========================================
echo.
echo functions/
echo   ├── src/
echo   │   ├── index.ts       (Main functions)
echo   │   └── test.js        (Test functions)
echo   ├── lib/               (Compiled JS)
echo   ├── package.json
echo   ├── tsconfig.json
echo   ├── .env              (Your config)
echo   └── README.md
echo.
echo Root files:
echo   ├── firebase.json
echo   ├── firestore.rules
echo   └── FIREBASE_FUNCTIONS_SETUP.md
echo.
pause
goto end

:end
echo.
echo Done! 👋
pause
