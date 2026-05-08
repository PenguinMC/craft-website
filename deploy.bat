@echo off
title CRAFT Flight Training - Vercel Deploy
cd /d "%~dp0"
echo ============================================
echo CRAFT Flight Training - Deploy to Vercel
echo ============================================
echo.

echo [1/5] Cleaning up half-broken .git folder...
if exist .git (
  attrib -h -r -s .git\* /s /d 2>nul
  rmdir /s /q .git 2>nul
  if exist .git (
    echo  - Could not remove .git automatically. Delete it manually then re-run.
    pause
    exit /b 1
  )
  echo  - Removed .git
) else (
  echo  - Already clean
)
echo.

echo [2/5] Checking Node.js and npm...
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: Node.js is not installed.
  echo Install it from https://nodejs.org/ then re-run this script.
  echo.
  pause
  exit /b 1
)
for /f %%i in ('node --version') do echo  - node %%i
for /f %%i in ('npm --version') do echo  - npm %%i
echo.

echo [3/5] Checking Vercel CLI...
where vercel >nul 2>nul
if errorlevel 1 (
  echo  - Installing Vercel CLI globally (~30 sec)...
  call npm install -g vercel
  if errorlevel 1 (
    echo.
    echo ERROR: vercel install failed.
    echo Try running this script as Administrator.
    pause
    exit /b 1
  )
)
echo  - Vercel CLI ready
echo.

echo [4/5] Login to Vercel (browser opens; sign in or sign up - it is free)...
echo.
call vercel login
echo.

echo [5/5] Deploying to production...
echo.
call vercel --prod --yes
echo.

echo ============================================
echo Done! Your site is live.
echo The URL appeared above (look for "Production: https://...").
echo ============================================
echo.
pause
