// Jenkins Pipeline configuration for match notification
// Save this as Jenkinsfile in your repository

pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS'  // Requires NodeJS plugin and configured tool in Jenkins
    }
    
    parameters {
        string(name: 'TEAM_NAME', defaultValue: 'Volos', description: 'Name of the team to check')
        string(name: 'NOTIFICATION_EMAIL', defaultValue: '', description: 'Email address for notifications (optional)')
    }
    
    triggers {
        // Run every day at 10:00 AM
        cron('0 10 * * *')
    }
    
    stages {
        stage('Setup') {
            steps {
                echo "Checking next match for: ${params.TEAM_NAME}"
                echo "Current date: ${new Date()}"
                
                // Verify Node.js is available
                sh 'node --version'
                sh 'npm --version'
                
                // Clean and install dependencies
                sh '''
                    rm -rf node_modules package-lock.json
                    npm config set strict-ssl false
                    npm config set registry https://registry.npmjs.org/
                    npm install --no-audit --no-fund
                '''
            }
        }
        
        stage('Check Next Match') {
            steps {
                script {
                    // Run the check script
                    def exitCode = sh(
                        script: "node scripts/check-next-match.js '${params.TEAM_NAME}'",
                        returnStatus: true
                    )
                    
                    echo "Script exit code: ${exitCode}"
                    
                    // Handle different exit codes
                    if (exitCode == 0) {
                        // Match tomorrow - send notification
                        env.SEND_NOTIFICATION = 'true'
                        echo "✅ Match found tomorrow - notification will be sent"
                    } else if (exitCode == 1) {
                        // Match found but not tomorrow
                        env.SEND_NOTIFICATION = 'false'
                        echo "ℹ️ Match found but not tomorrow - no notification needed"
                    } else if (exitCode == 2) {
                        // No match found
                        env.SEND_NOTIFICATION = 'false'
                        echo "⚠️ No upcoming match found"
                    } else {
                        // Error
                        error "Script failed with exit code ${exitCode}"
                    }
                }
            }
        }
        
        stage('Send Notification') {
            when {
                environment name: 'SEND_NOTIFICATION', value: 'true'
            }
            steps {
                script {
                    echo "🔔 Sending notification for match tomorrow!"
                    
                    // Capture match details from console output
                    def consoleLog = currentBuild.rawBuild.getLog(100).join('\n')
                    
                    // Extract match details using find() to avoid non-serializable Matcher
                    def matchDetails = 'See build log'
                    def matchDate = ''
                    def matchTime = ''
                    
                    def matchMatch = (consoleLog =~ /Match:\s+(.+)/)
                    if (matchMatch.find()) {
                        matchDetails = matchMatch.group(1)
                    }
                    matchMatch = null
                    
                    def dateMatch = (consoleLog =~ /Date:\s+(.+)/)
                    if (dateMatch.find()) {
                        matchDate = dateMatch.group(1)
                    }
                    dateMatch = null
                    
                    def timeMatch = (consoleLog =~ /Time:\s+(.+)/)
                    if (timeMatch.find()) {
                        matchTime = timeMatch.group(1)
                    }
                    timeMatch = null
                    
                    if (params.NOTIFICATION_EMAIL) {
                        echo "Preparing to send email..."
                        echo "To: ${params.NOTIFICATION_EMAIL}"
                        echo "Subject: ⚽ Match Alert: ${params.TEAM_NAME} plays tomorrow!"
                        echo "Match Details: ${matchDetails}"
                        echo "Date: ${matchDate}, Time: ${matchTime}"
                        
                        try {
                            // Try simple mail step first
                            mail (
                                to: params.NOTIFICATION_EMAIL,
                                subject: "⚽ Match Alert: ${params.TEAM_NAME} plays tomorrow!",
                                body: """
Match Tomorrow!

Your team ${params.TEAM_NAME} has a match tomorrow.

Match Details:
Teams: ${matchDetails}
Date: ${matchDate}
Time: ${matchTime}

View full details: ${BUILD_URL}console

This is an automated notification from your match tracking system.
Build #${BUILD_NUMBER}
                                """
                            )
                            echo "📧 Email sent successfully to: ${params.NOTIFICATION_EMAIL}"
                        } catch (Exception e) {
                            echo "❌ Email failed: ${e.message}"
                            echo "Stack trace: ${e}"
                        }
                    } else {
                        echo "⚠️ No email address configured"
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "Build completed at ${new Date()}"
        }
        success {
            echo "✅ Build successful"
        }
        failure {
            echo "❌ Build failed"
        }
    }
}
