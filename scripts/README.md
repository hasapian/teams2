# Match Notification Scripts

Scripts for checking upcoming matches and sending notifications.

## check-next-match.js

Checks for the next upcoming match for a specific team across all configured leagues.

### Usage

```bash
node scripts/check-next-match.js <team-name>
```

### Examples

```bash
node scripts/check-next-match.js Volos
node scripts/check-next-match.js "Manchester United"
node scripts/check-next-match.js Olympiakos
```

### Exit Codes

- `0` - Match found and is tomorrow (notification should be sent)
- `1` - Match found but not tomorrow
- `2` - No upcoming match found
- `3` - Fatal error

### Jenkins Configuration

Create a Jenkins freestyle job with the following settings:

#### Build Triggers
- Build periodically: `0 10 * * *` (runs daily at 10:00 AM)

#### Build Steps
Add an "Execute shell" step (Linux) or "Execute Windows batch command" (Windows):

**Linux/Mac:**
```bash
#!/bin/bash
cd /path/to/teams2
node scripts/check-next-match.js "$TEAM_NAME"

# Check exit code
if [ $? -eq 0 ]; then
    echo "Notification: Match tomorrow!"
    # Here you can add email notification or other actions
    # For example, send email using mail command:
    # echo "Match tomorrow for $TEAM_NAME" | mail -s "Match Alert" your@email.com
fi
```

**Windows:**
```batch
cd C:\path\to\teams2
node scripts\check-next-match.js %TEAM_NAME%

if %ERRORLEVEL% EQU 0 (
    echo Notification: Match tomorrow!
    REM Add email notification here
)
```

#### Parameters
Add a string parameter named `TEAM_NAME` with default value `Volos`

### Sample Output

```
Checking next match for: Volos
Searching across all leagues...

Checking Super League (Greece)...
Checking Premier League (England)...
Checking La Liga (Spain)...
Checking Serie A (Italy)...
Checking Bundesliga (Germany)...

============================================================
✅ NEXT MATCH FOUND
============================================================
League:      Super League (Greece)
Match:       Volos vs Kifisia
Date:        Sat 6 Dec
Time:        18:30
Full Date:   12/6/2025, 6:30:00 PM
Days until:  4 day(s)
============================================================
ℹ️  Match is in 4 days (no notification needed)
```

### Future Enhancements

- Add email notification integration
- Support for multiple teams
- Database storage for subscriptions
- Webhook notifications
