// Jenkins Pipeline configuration for match notification
// Save this as Jenkinsfile in your repository

pipeline {
    agent any
    
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
                    
                    if (params.NOTIFICATION_EMAIL) {
                        // Email notification (requires Email Extension Plugin)
                        emailext (
                            subject: "⚽ Match Alert: ${params.TEAM_NAME} plays tomorrow!",
                            body: """
                                <h2>Match Tomorrow!</h2>
                                <p>Your team <strong>${params.TEAM_NAME}</strong> has a match tomorrow.</p>
                                <p>Check the details in the build console output.</p>
                                <p><a href="${BUILD_URL}console">View Build Log</a></p>
                            """,
                            to: params.NOTIFICATION_EMAIL,
                            mimeType: 'text/html'
                        )
                        echo "📧 Email sent to: ${params.NOTIFICATION_EMAIL}"
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
