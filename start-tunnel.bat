@echo off
echo ========================================================
echo Starting JobAnalytica Full Stack + Live Mobile Tunnel
echo ========================================================

call pnpm install
call pnpm --filter @jobanalytica/shared-types build
call pnpm --filter api db:push
call pnpm --filter api build
call pnpm --filter web build

start "JobAnalytica API" cmd /k "pnpm --filter api start:prod"
timeout /t 3 /nobreak >nul
start "JobAnalytica Web" cmd /k "pnpm --filter web start"
timeout /t 3 /nobreak >nul
start "JobAnalytica Mobile Tunnel" cmd /k "node scripts/launch-tunnel.js"

echo.
echo ========================================================
echo Stack + Live Tunnel Active!
echo Local Web:   http://localhost:3000
echo Local API:   http://localhost:4000/api/v1/health
echo Mobile URL:  (Check the Mobile Tunnel window for your https://*.trycloudflare.com link)
echo ========================================================
pause
