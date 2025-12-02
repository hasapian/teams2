# Jenkins Setup Guide for Match Notifications

This guide explains how to set up automated match notifications using Jenkins.

## Prerequisites

- Jenkins server (any version)
- Node.js installed on Jenkins server
- This repository cloned on Jenkins server

## Quick Start

### Option 1: Freestyle Project (Recommended for POC)

1. **Create New Job**
   - Click "New Item" in Jenkins
   - Enter name: `Match-Notification-Volos`
   - Select "Freestyle project"
   - Click OK

2. **Configure General Settings**
   - Description: `Daily check for Volos upcoming matches`
   - Check "This project is parameterized"
   - Add String Parameter:
     - Name: `TEAM_NAME`
     - Default Value: `Volos`
     - Description: `Name of the team to monitor`

3. **Configure Build Triggers**
   - Check "Build periodically"
   - Schedule: `0 10 * * *` (runs daily at 10:00 AM)
   - Or use: `H 10 * * *` (runs once daily around 10 AM)

4. **Configure Build Steps**

   **For Windows:**
   - Add build step: "Execute Windows batch command"
   - Command:
     ```batch
     cd C:\path\to\teams2
     node scripts\check-next-match.js "%TEAM_NAME%"
     
     if %ERRORLEVEL% EQU 0 (
         echo NOTIFICATION: Match tomorrow for %TEAM_NAME%!
         REM Add your notification method here
     )
     ```

   **For Linux/Mac:**
   - Add build step: "Execute shell"
   - Command:
     ```bash
     cd /path/to/teams2
     node scripts/check-next-match.js "$TEAM_NAME"
     
     if [ $? -eq 0 ]; then
         echo "NOTIFICATION: Match tomorrow for $TEAM_NAME!"
         # Add your notification method here
     fi
     ```

5. **Save and Test**
   - Click "Save"
   - Click "Build with Parameters"
   - Enter team name and build

### Option 2: Pipeline Project (Advanced)

1. **Create New Pipeline**
   - Click "New Item"
   - Enter name: `Match-Notification-Pipeline`
   - Select "Pipeline"
   - Click OK

2. **Configure Pipeline**
   - In "Pipeline" section, select "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: (your repo URL)
   - Script Path: `Jenkinsfile`
   - Click Save

3. **Configure Parameters**
   - Check "This project is parameterized"
   - Add String Parameters:
     - `TEAM_NAME` (default: `Volos`)
     - `NOTIFICATION_EMAIL` (optional)

4. **Set Schedule**
   - In pipeline configuration, check "Build periodically"
   - Schedule: `0 10 * * *`

## Notification Methods

### 1. Email Notification (Requires Email Plugin)

**Install Email Extension Plugin:**
- Manage Jenkins → Manage Plugins → Available
- Search "Email Extension Plugin"
- Install and restart

**Configure in Job:**

For freestyle jobs, add post-build action:
- Add post-build action → "Editable Email Notification"
- Project Recipient List: `your@email.com`
- Advanced Settings → Triggers → Add "Script"
- Script:
  ```groovy
  import hudson.model.*
  
  def build = Thread.currentThread().executable
  def exitCode = build.getLog(100).join('\n').contains('Exit code: 0')
  
  if (exitCode) {
      return true  // Send email
  }
  return false
  ```

### 2. Slack Notification (Free)

**Get Slack Webhook URL:**
1. Go to your Slack workspace
2. Create an Incoming Webhook: https://api.slack.com/messaging/webhooks
3. Copy the webhook URL

**Add to script:**
```bash
# In jenkins-check.sh or jenkins-check.bat
if [ $EXIT_CODE -eq 0 ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"⚽ Match Alert: '"$TEAM_NAME"' plays tomorrow!"}' \
      https://hooks.slack.com/services/YOUR/WEBHOOK/URL
fi
```

### 3. Webhook/HTTP POST (Most Flexible)

Send to any webhook service:

```bash
curl -X POST https://your-service.com/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "team": "'"$TEAM_NAME"'",
    "event": "match_tomorrow",
    "timestamp": "'$(date -Iseconds)'"
  }'
```

### 4. Write to File (Simple)

```bash
if [ $EXIT_CODE -eq 0 ]; then
    echo "$(date): Match tomorrow for $TEAM_NAME" >> /var/log/match-alerts.txt
fi
```

## Monitoring Multiple Teams

### Approach 1: Multiple Jobs

Create separate Jenkins job for each team:
- `Match-Notification-Volos`
- `Match-Notification-Olympiakos`
- `Match-Notification-PAOK`

Each runs on the same schedule.

### Approach 2: Loop in Script

Modify the script to check multiple teams:

```bash
#!/bin/bash
TEAMS=("Volos" "Olympiakos" "PAOK" "AEK Athens")

for TEAM in "${TEAMS[@]}"; do
    echo "Checking $TEAM..."
    node scripts/check-next-match.js "$TEAM"
    
    if [ $? -eq 0 ]; then
        echo "ALERT: $TEAM plays tomorrow!"
        # Send notification
    fi
done
```

### Approach 3: Database Integration (Future)

Store team subscriptions in a database and loop through them.

## Troubleshooting

### Node.js not found
- Ensure Node.js is in PATH
- Or use full path: `/usr/bin/node` or `C:\Program Files\nodejs\node.exe`

### Script exits with code 3
- Check network connectivity
- Verify soccerstats.com is accessible
- Check Jenkins console log for errors

### Wrong timezone
- Check Jenkins system time
- Adjust cron schedule accordingly
- Use TZ environment variable: `TZ=Europe/Athens`

### No email received
- Check spam folder
- Verify SMTP settings in Jenkins
- Test with a simple test email first

## Cron Schedule Examples

```
0 10 * * *     # Every day at 10:00 AM
0 9 * * 1-5    # Weekdays at 9:00 AM
0 8,20 * * *   # Twice daily: 8 AM and 8 PM
H 10 * * *     # Once daily around 10 AM (load balanced)
```

## Testing

### Test the script directly:
```bash
node scripts/check-next-match.js Volos
echo $?  # Should show exit code
```

### Test Jenkins job:
1. Click "Build Now" or "Build with Parameters"
2. Check Console Output
3. Verify exit code and output

### Test notification:
Temporarily change the exit code condition to always trigger:
```bash
# In jenkins-check.sh
EXIT_CODE=0  # Force notification for testing
```

## Security Notes

- Don't commit webhook URLs or email credentials to git
- Use Jenkins Credentials for sensitive data
- Reference credentials in scripts: `${WEBHOOK_URL}`

## Next Steps

Once the POC is working, consider:
1. Adding a database to store team subscriptions
2. Building a web UI for users to subscribe
3. Integrating with email service (SendGrid, Mailgun)
4. Adding more leagues and sports
5. Creating a dashboard to view upcoming matches
