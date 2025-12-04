# ⚽ Teams Without Draws Tracker

A serverless web application that tracks football teams with consecutive games without draws across 5 European leagues.

## Features

- 🔍 Search teams by minimum no-draw streak
- 🌍 5 European leagues: Greece, England, Spain, Italy, Germany
- 🔄 Refresh data on-demand with league selection
- 💨 10-minute caching for fast responses
- 📱 Mobile-responsive design
- ☁️ Serverless deployment on Vercel
- 🔔 **NEW:** Automated match notifications via Jenkins cron jobs

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **Scraping**: Cheerio + node-fetch
- **Data Source**: soccerstats.com
- **Deployment**: Vercel

## Local Development

```bash
# Install dependencies
npm install

# Install Vercel CLI globally
npm install -g vercel

# Run locally
vercel dev
```

Visit `http://localhost:3000`

## Deploy to Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

Or connect your GitHub repo to Vercel for automatic deployments.

## How It Works

1. User searches for teams with minimum no-draw streak
2. API scrapes data from soccerstats.com (if not cached)
3. Data is cached for 10 minutes in memory
4. Results are filtered and returned to the frontend

## Match Notifications (POC)

Automated daily checks for upcoming matches using Jenkins cron jobs.

### Quick Start

```bash
# Check next match for a team
node scripts/check-next-match.js Volos

# Returns exit code:
# 0 = Match tomorrow (send notification)
# 1 = Match found but not tomorrow
# 2 = No upcoming match found
```

### Jenkins Setup

See [Jenkins Setup Guide](docs/JENKINS_SETUP.md) for complete instructions.

**TL;DR:**
1. Create Jenkins freestyle job
2. Add parameter: `TEAM_NAME` (default: `Volos`)
3. Set schedule: `0 10 * * *` (daily at 10 AM)
4. Execute: `node scripts/check-next-match.js "%TEAM_NAME%"`
5. Configure notification method (email/Slack/webhook)

## Project Structure

```
teams2/
├── api/              # Vercel serverless functions
├── lib/              # Shared utilities
├── public/           # Frontend files
├── scripts/          # Automation scripts
│   ├── check-next-match.js    # Match checker
│   ├── jenkins-check.bat      # Windows wrapper
│   └── jenkins-check.sh       # Linux wrapper
├── docs/             # Documentation
│   └── JENKINS_SETUP.md       # Jenkins guide
├── Jenkinsfile       # Pipeline configuration
└── README.md
```
5. Refresh button allows manual cache invalidation

## API Endpoints

- `GET /api/teams?league={league}&minGames={number}` - Get teams by criteria
- `POST /api/refresh` - Force refresh data for selected leagues

## License

MIT

No docker, supabase for DB
