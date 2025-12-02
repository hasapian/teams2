#!/bin/bash
# Jenkins Linux/Mac bash script for checking next match
# This script checks if a team has a match tomorrow and sends notification

echo "========================================"
echo "Match Notification Check"
echo "Team: $TEAM_NAME"
echo "Date: $(date)"
echo "========================================"

# Navigate to project directory
cd /path/to/teams2 || exit 1

# Run the check script
node scripts/check-next-match.js "$TEAM_NAME"

# Capture exit code
EXIT_CODE=$?

echo ""
echo "Exit code: $EXIT_CODE"

# Handle different scenarios
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "   MATCH TOMORROW - SENDING NOTIFICATION"
    echo "============================================"
    echo ""
    
    # Option 1: Send email using mail command
    # Uncomment and configure the following lines:
    # echo "Your team $TEAM_NAME has a match tomorrow!" | mail -s "Match Alert: $TEAM_NAME plays tomorrow!" $NOTIFICATION_EMAIL
    
    # Option 2: Call a webhook using curl
    # curl -X POST https://your-webhook-url.com/notify \
    #   -H "Content-Type: application/json" \
    #   -d "{\"team\":\"$TEAM_NAME\",\"message\":\"Match tomorrow!\"}"
    
    # Option 3: Send Slack notification
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"⚽ Match Alert: $TEAM_NAME plays tomorrow!\"}" \
    #   $SLACK_WEBHOOK_URL
    
    echo "Notification sent!"
    
elif [ $EXIT_CODE -eq 1 ]; then
    echo "No notification needed - match not tomorrow"
elif [ $EXIT_CODE -eq 2 ]; then
    echo "No upcoming match found"
else
    echo "ERROR: Script failed with code $EXIT_CODE"
    exit $EXIT_CODE
fi

echo ""
echo "Check completed successfully"
exit 0
