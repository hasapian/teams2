// Jenkins Pipeline configuration for match notification
// Save this as Jenkinsfile in your repository

pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS'  // Requires NodeJS plugin and configured tool in Jenkins
    }
    
    parameters {
        string(name: 'TEAM_NAME', defaultValue: 'Volos', description: 'Team names to check (comma-separated for multiple teams, e.g., "Fulham, Udinese")')
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
                    // Parse comma-separated teams
                    def teams = params.TEAM_NAME.split(',').collect { it.trim() }
                    echo "Checking ${teams.size()} team(s): ${teams.join(', ')}"
                    
                    env.SEND_NOTIFICATION = 'false'
                    def matchesTomorrow = []
                    
                    // Check each team
                    teams.each { team ->
                        echo "\n--- Checking team: ${team} ---"
                        def exitCode = sh(
                            script: "node scripts/check-next-match.js '${team}'",
                            returnStatus: true
                        )
                        
                        echo "Script exit code for ${team}: ${exitCode}"
                        
                        // Handle different exit codes
                        if (exitCode == 0) {
                            // Match tomorrow - add to list
                            matchesTomorrow.add(team)
                            env.SEND_NOTIFICATION = 'true'
                            echo "✅ ${team}: Match found tomorrow"
                        } else if (exitCode == 1) {
                            echo "ℹ️ ${team}: Match found but not tomorrow"
                        } else if (exitCode == 2) {
                            echo "⚠️ ${team}: No upcoming match found"
                        } else {
                            echo "❌ ${team}: Script failed with exit code ${exitCode}"
                        }
                    }
                    
                    // Store teams with matches tomorrow for notification
                    env.TEAMS_WITH_MATCHES = matchesTomorrow.join(', ')
                    
                    if (matchesTomorrow.size() > 0) {
                        echo "\n🔔 Total teams with matches tomorrow: ${matchesTomorrow.join(', ')}"
                    } else {
                        echo "\nℹ️ No teams have matches tomorrow"
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
                    
                    // Set default email if not provided
                    def emailTo = params.NOTIFICATION_EMAIL ?: 'spiderman8787@gmail.com'
                    def teamsWithMatches = env.TEAMS_WITH_MATCHES
                    
                    echo "Preparing to send email..."
                    echo "To: ${emailTo}"
                    echo "Teams with matches tomorrow: ${teamsWithMatches}"
                    
                    try {
                        mail (
                            to: emailTo,
                            subject: "⚽ Match Alert: ${teamsWithMatches} - Matches Tomorrow!",
                            body: """
Match Alert - Tomorrow's Matches!

The following team(s) have matches tomorrow:
${teamsWithMatches}

View full details and match information: ${BUILD_URL}console

This is an automated notification from your match tracking system.
Build #${BUILD_NUMBER}
                            """
                        )
                        echo "📧 Email sent successfully to: ${emailTo}"
                    } catch (Exception e) {
                        echo "❌ Email failed: ${e.message}"
                        echo "Stack trace: ${e}"
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
