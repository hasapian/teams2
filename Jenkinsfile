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
                
                // Configure npm for proxy and install dependencies
                sh '''
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
                    def matchLine = (consoleLog =~ /Match:\s+(.+)/)
                    def dateLine = (consoleLog =~ /Date:\s+(.+)/)
                    def timeLine = (consoleLog =~ /Time:\s+(.+)/)
                    
                    def matchDetails = matchLine ? matchLine[0][1] : 'See build log'
                    def matchDate = dateLine ? dateLine[0][1] : ''
                    def matchTime = timeLine ? timeLine[0][1] : ''
                    
                    if (params.NOTIFICATION_EMAIL) {
                        // Email notification (requires Email Extension Plugin)
                        emailext (
                            subject: "⚽ Match Alert: ${params.TEAM_NAME} plays tomorrow!",
                            body: """
                                <html>
                                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                            <h2 style="color: #2c5f2d; margin-top: 0;">⚽ Match Tomorrow!</h2>
                                            
                                            <p style="font-size: 16px;">Your team <strong style="color: #2c5f2d;">${params.TEAM_NAME}</strong> has a match tomorrow.</p>
                                            
                                            <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
                                                <h3 style="margin-top: 0; color: #2c5f2d;">Match Details</h3>
                                                <p style="margin: 5px 0;"><strong>Teams:</strong> ${matchDetails}</p>
                                                <p style="margin: 5px 0;"><strong>Date:</strong> ${matchDate}</p>
                                                <p style="margin: 5px 0;"><strong>Time:</strong> ${matchTime}</p>
                                            </div>
                                            
                                            <p style="text-align: center; margin-top: 30px;">
                                                <a href="${BUILD_URL}console" 
                                                   style="display: inline-block; padding: 12px 30px; background-color: #2c5f2d; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                                    View Full Details
                                                </a>
                                            </p>
                                            
                                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                                            
                                            <p style="font-size: 12px; color: #666; text-align: center;">
                                                This is an automated notification from your match tracking system.<br>
                                                Build #${BUILD_NUMBER} - ${new Date().format('yyyy-MM-dd HH:mm:ss')}
                                            </p>
                                        </div>
                                    </div>
                                </body>
                                </html>
                            """,
                            to: params.NOTIFICATION_EMAIL,
                            mimeType: 'text/html',
                            recipientProviders: [[$class: 'DevelopersRecipientProvider']],
                            replyTo: '$DEFAULT_REPLYTO',
                            from: 'jenkins@yourdomain.com'  // Change this to your Jenkins email
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
