# Quick Reference - Match Notification System

## Test the Script Locally

```bash
# Basic test
node scripts/check-next-match.js Volos

# Check exit code (PowerShell)
node scripts/check-next-match.js Volos; echo "Exit code: $LASTEXITCODE"

# Check exit code (CMD)
node scripts\check-next-match.js Volos & echo Exit code: %ERRORLEVEL%
```

## Jenkins Setup (5 Minutes)

### 1. Create Job
- New Item → Freestyle Project
- Name: `Match-Check-Volos`

### 2. Add Parameter
- ✅ This project is parameterized
- String Parameter: `TEAM_NAME` = `Volos`

### 3. Set Schedule
- ✅ Build periodically
- Schedule: `0 10 * * *` (10 AM daily)

### 4. Add Build Step
**Windows:**
```batch
cd C:\path\to\teams2
node scripts\check-next-match.js "%TEAM_NAME%"
if %ERRORLEVEL% EQU 0 echo MATCH TOMORROW!
```

**Linux:**
```bash
cd /path/to/teams2
node scripts/check-next-match.js "$TEAM_NAME"
[ $? -eq 0 ] && echo "MATCH TOMORROW!"
```

### 5. Save & Test
- Build with Parameters → Build Now

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Match tomorrow | ✅ Send notification |
| 1 | Match later | ⏭️ Skip |
| 2 | No match found | ⏭️ Skip |
| 3 | Error | ❌ Check logs |

## Notification Options

### Slack (Easiest)
```bash
if %ERRORLEVEL% EQU 0 (
    curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL ^
    -H "Content-Type: application/json" ^
    -d "{\"text\":\"⚽ Match tomorrow for %TEAM_NAME%!\"}"
)
```

### Email (Jenkins Plugin Required)
- Post-build Actions → Email Extension
- Trigger: Script Trigger
- Check if exit code = 0

### Webhook
```bash
curl -X POST https://your-api.com/notify \
  -H "Content-Type: application/json" \
  -d '{"team":"Volos","alert":"match_tomorrow"}'
```

## Cron Schedules

| Schedule | Description |
|----------|-------------|
| `0 10 * * *` | Every day at 10:00 AM |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `0 8,20 * * *` | 8 AM and 8 PM daily |
| `H 10 * * *` | Once daily ~10 AM (load balanced) |

## Multiple Teams

### Option A: Multiple Jobs
Create separate job for each team

### Option B: Loop in Script
```bash
for TEAM in Volos Olympiakos PAOK; do
    node scripts/check-next-match.js "$TEAM"
    [ $? -eq 0 ] && echo "Alert for $TEAM"
done
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Node not found | Add Node.js to PATH or use full path |
| Script exits 3 | Check network, verify soccerstats.com access |
| Wrong time | Check Jenkins timezone settings |
| No notification | Verify notification method configuration |

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/check-next-match.js` | Main checker script |
| `scripts/jenkins-check.bat` | Windows wrapper |
| `scripts/jenkins-check.sh` | Linux wrapper |
| `Jenkinsfile` | Pipeline config |
| `docs/JENKINS_SETUP.md` | Full guide |
| `docs/POC_SUMMARY.md` | This POC overview |

## Support Leagues

- 🇬🇷 Greece - Super League
- 🏴󐁧󐁢󐁥󐁮󐁧󐁿 England - Premier League
- 🇪🇸 Spain - La Liga
- 🇮🇹 Italy - Serie A
- 🇩🇪 Germany - Bundesliga

## Next Steps

1. ✅ Test script locally
2. ✅ Set up Jenkins job
3. ✅ Configure notification
4. ✅ Run test build
5. ✅ Wait for tomorrow to verify

---

**Ready to deploy!** 🚀

For detailed instructions, see: `docs/JENKINS_SETUP.md`
