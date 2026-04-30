@echo off
REM SIRAJ Quick Start Script (Windows)
REM This script sets up the project step-by-step

echo ================================================
echo SIRAJ - Next.js RFQ Platform Setup
echo ================================================
echo.

REM Step 1: Install dependencies
echo 📦 Step 1: Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm install failed
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Step 2: Environment setup
echo 🔧 Step 2: Setting up environment variables...
if not exist .env.local (
    copy .env.example .env.local
    echo ✅ .env.local created (please edit with your Supabase credentials)
) else (
    echo ℹ️  .env.local already exists
)
echo.

REM Step 3: Summary
echo ================================================
echo ✅ Setup Complete!
echo ================================================
echo.
echo 📝 Next steps:
echo   1. Edit .env.local with your Supabase credentials
echo   2. Run: npx shadcn-ui@latest init
echo   3. Run: npx shadcn-ui@latest add button input label textarea select card table badge dialog
echo   4. Run: npm run dev
echo.
echo 🚀 Start development at: http://localhost:3000
echo.
pause
