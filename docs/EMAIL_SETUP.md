# Email Configuration for Jenkins Pipeline

This guide shows how to configure email notifications in your Jenkins Pipeline job for match alerts.

## Prerequisites

### 1. Install Email Extension Plugin

1. Go to **Manage Jenkins** → **Manage Plugins**
2. Click **Available** tab
3. Search for "Email Extension Plugin"
4. Check the box and click **Install without restart**
5. Wait for installation to complete

## Configure Jenkins Email Settings

### Step 1: Configure System Email (Extended E-mail Notification)

1. Go to **Manage Jenkins** → **Configure System**
2. Scroll to **Extended E-mail Notification** section
3. Configure the following:

**SMTP server:** `smtp.gmail.com` (or your email provider)

**SMTP Port:** 
- Gmail: `587` (TLS) or `465` (SSL)
- Outlook: `587`
- Other: Check your provider

**Advanced Settings (click Advanced):**

- **Use SMTP Authentication:** ✅ Checked
- **User Name:** `your-email@gmail.com`
- **Password:** Your app password (see below)
- **Use SSL:** ✅ Checked (if using port 465)
- **Use TLS:** ✅ Checked (if using port 587)
- **SMTP port:** `587` (or `465`)

**Default Recipients:** Your email (optional fallback)

**Default Content Type:** `HTML (text/html)`

**Click:** Test configuration by sending test e-mail

### Step 2: Configure Standard Email (Optional, for fallback)

1. In the same page, scroll to **E-mail Notification**
2. Configure:
   - **SMTP server:** Same as above
   - **Advanced:** Same credentials

## Email Provider Setup

### Gmail (Recommended for Testing)

**Important:** Gmail requires an "App Password" - you cannot use your regular password.

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" → Enter "Jenkins"
   - Click **Generate**
   - Copy the 16-character password
   - Use this in Jenkins (no spaces)

3. **Gmail SMTP Settings:**
   ```
   SMTP server: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [16-character app password]
   Use TLS: Yes
   ```

### Outlook/Office 365

1. **SMTP Settings:**
   ```
   SMTP server: smtp-mail.outlook.com or smtp.office365.com
   Port: 587
   Username: your-email@outlook.com
   Password: Your password
   Use TLS: Yes
   ```

2. **Note:** Some accounts may need app-specific passwords

### Custom SMTP Server

```
SMTP server: mail.yourcompany.com
Port: 587 (or 25, 465)
Username: your-email@yourcompany.com
Password: Your password
TLS/SSL: As required
```

## Pipeline Configuration

### Your Jenkinsfile Already Has Email Support!

The updated `Jenkinsfile` already includes the `emailext` step. Just need to:

1. **Set the `from` address** (line 72 in Jenkinsfile):
   ```groovy
   from: 'jenkins@yourdomain.com'  // Change to your email
   ```

2. **Run with parameters:**
   - `TEAM_NAME`: Volos (or your team)
   - `NOTIFICATION_EMAIL`: your-email@gmail.com

### Test the Email

1. **Quick Test - Skip to Tomorrow:**
   
   Temporarily modify `check-next-match.js` to force notification:
   
   ```javascript
   // Around line 204, temporarily change:
   if (daysUntilMatch === 1) {
   
   // To (for testing):
   if (daysUntilMatch >= 1) {  // Will trigger for any match found
   ```

2. **Build with Parameters:**
   - Team: `Volos`
   - Email: `your-email@gmail.com`
   - Click **Build**

3. **Check Console Output:**
   - Look for "📧 Email sent to..."
   - Check your inbox (and spam folder)

4. **Revert the change** after testing

## Email Template Customization

The email template is in `Jenkinsfile` around line 44-75. You can customize:

### Change Colors
```groovy
style="color: #2c5f2d;"  // Change green to your color
background-color: #2c5f2d;  // Button color
```

### Add More Details
```groovy
body: """
    <html>
    <body>
        <h2>⚽ Match Tomorrow!</h2>
        <p>Team: ${params.TEAM_NAME}</p>
        <p>Match: ${matchDetails}</p>
        <p>Time: ${matchTime}</p>
        
        <!-- Add custom content here -->
        <p>Good luck to the team!</p>
    </body>
    </html>
"""
```

### Use Plain Text Instead
```groovy
emailext (
    subject: "Match Alert: ${params.TEAM_NAME}",
    body: """
        Match Tomorrow!
        
        Team: ${params.TEAM_NAME}
        Match: ${matchDetails}
        Time: ${matchTime}
        
        View details: ${BUILD_URL}console
    """,
    mimeType: 'text/plain',  // Changed from text/html
    to: params.NOTIFICATION_EMAIL
)
```

## Advanced Options

### Send to Multiple Recipients

```groovy
to: 'email1@example.com, email2@example.com, email3@example.com'
```

Or use parameter with comma-separated emails.

### Add CC/BCC

```groovy
emailext (
    to: params.NOTIFICATION_EMAIL,
    cc: 'manager@example.com',
    bcc: 'archive@example.com',
    // ... rest of config
)
```

### Attach Build Log

```groovy
emailext (
    attachLog: true,
    compressLog: true,
    // ... rest of config
)
```

### Only Email on Failure

```groovy
post {
    failure {
        emailext (
            subject: "Build Failed: ${env.JOB_NAME}",
            body: "Build failed. Check ${BUILD_URL}",
            to: params.NOTIFICATION_EMAIL
        )
    }
}
```

## Troubleshooting

### Email Not Received

1. **Check Jenkins Console Output**
   - Look for error messages
   - Verify "Email sent to..." appears

2. **Check Spam Folder**
   - Email might be filtered

3. **Test SMTP Settings**
   - Go to Jenkins → Configure System
   - Extended E-mail Notification → Advanced
   - Click "Test configuration by sending test e-mail"

4. **Check Firewall**
   - Ensure Jenkins can reach SMTP server
   - Port 587 or 465 must be open

### Authentication Failed

1. **Gmail:** Use App Password, not regular password
2. **2FA Required:** Enable 2-factor authentication first
3. **Less Secure Apps:** Some providers block automated access

### SSL/TLS Errors

```
Try different port configurations:
- Port 587 with TLS
- Port 465 with SSL
- Port 25 without encryption (not recommended)
```

### HTML Not Rendering

```groovy
// Make sure mimeType is set:
mimeType: 'text/html'
```

## Example Email Output

When a match is found tomorrow, recipient will receive:

```
Subject: ⚽ Match Alert: Volos plays tomorrow!

┌────────────────────────────────┐
│   ⚽ Match Tomorrow!            │
│                                 │
│   Your team Volos has a match  │
│   tomorrow.                     │
│                                 │
│   Match Details                 │
│   Teams: Volos vs Kifisia      │
│   Date: Sat 6 Dec              │
│   Time: 18:30                  │
│                                 │
│   [View Full Details]          │
│                                 │
│   Build #42 - 2025-12-05       │
└────────────────────────────────┘
```

## Quick Reference

### Complete emailext Parameters

```groovy
emailext (
    // Required
    subject: 'Email Subject',
    body: 'Email Body (can be HTML)',
    to: 'recipient@example.com',
    
    // Optional
    from: 'sender@example.com',
    cc: 'cc@example.com',
    bcc: 'bcc@example.com',
    replyTo: 'reply@example.com',
    mimeType: 'text/html',  // or 'text/plain'
    
    // Attachments
    attachLog: true,
    compressLog: true,
    attachmentsPattern: '**/*.pdf',
    
    // Recipients
    recipientProviders: [
        [$class: 'DevelopersRecipientProvider'],
        [$class: 'RequesterRecipientProvider']
    ]
)
```

## Security Best Practices

1. **Use Jenkins Credentials:**
   ```groovy
   // Store email password in Jenkins Credentials
   // Reference in pipeline:
   withCredentials([string(credentialsId: 'smtp-password', variable: 'SMTP_PASS')]) {
       // Use ${SMTP_PASS}
   }
   ```

2. **Don't Hardcode Emails:**
   - Use parameters
   - Store in external config
   - Use Jenkins user database

3. **Validate Email Addresses:**
   ```groovy
   if (params.NOTIFICATION_EMAIL =~ /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/) {
       // Send email
   }
   ```

## Next Steps

1. ✅ Install Email Extension Plugin
2. ✅ Configure SMTP in Jenkins
3. ✅ Set up email provider (Gmail app password)
4. ✅ Update `from` address in Jenkinsfile
5. ✅ Test with a build
6. ✅ Check inbox (and spam)
7. ✅ Customize template as needed

**Plugin Documentation:** https://plugins.jenkins.io/email-ext/

---

**You're ready to receive match alerts via email!** 📧⚽
