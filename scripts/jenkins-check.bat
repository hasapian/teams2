@echo off
REM Jenkins Windows batch script for checking next match
REM This script checks if a team has a match tomorrow and sends notification

echo ========================================
echo Match Notification Check
echo Team: %TEAM_NAME%
echo Date: %DATE% %TIME%
echo ========================================

REM Navigate to project directory
cd /d C:\path\to\teams2

REM Run the check script
node scripts\check-next-match.js "%TEAM_NAME%"

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

echo.
echo Exit code: %EXIT_CODE%

REM Handle different scenarios
if %EXIT_CODE% EQU 0 (
    echo.
    echo ============================================
    echo    MATCH TOMORROW - SENDING NOTIFICATION
    echo ============================================
    echo.
    
    REM Option 1: Send email using PowerShell (built-in)
    REM Uncomment and configure the following lines:
    REM powershell -Command "Send-MailMessage -From 'jenkins@yourdomain.com' -To '%NOTIFICATION_EMAIL%' -Subject 'Match Alert: %TEAM_NAME% plays tomorrow!' -Body 'Your team has a match tomorrow.' -SmtpServer 'smtp.yourdomain.com'"
    
    REM Option 2: Call a webhook
    REM curl -X POST https://your-webhook-url.com/notify -H "Content-Type: application/json" -d "{\"team\":\"%TEAM_NAME%\",\"message\":\"Match tomorrow!\"}"
    
    REM Option 3: Write to a file that another system monitors
    REM echo Match tomorrow for %TEAM_NAME% >> C:\notifications\pending.txt
    
    echo Notification sent!
    
) else if %EXIT_CODE% EQU 1 (
    echo No notification needed - match not tomorrow
) else if %EXIT_CODE% EQU 2 (
    echo No upcoming match found
) else (
    echo ERROR: Script failed with code %EXIT_CODE%
    exit /b %EXIT_CODE%
)

echo.
echo Check completed successfully
exit /b 0
