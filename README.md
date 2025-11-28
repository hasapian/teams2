# ⚽ Teams Without Draws Tracker

A serverless web application that tracks football teams with consecutive games without draws across 5 European leagues.

## Features

- 🔍 Search teams by minimum no-draw streak
- 🌍 5 European leagues: Greece, England, Spain, Italy, Germany
- 🔄 Refresh data on-demand with league selection
- 💨 10-minute caching for fast responses
- 📱 Mobile-responsive design
- ☁️ Serverless deployment on Vercel

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
5. Refresh button allows manual cache invalidation

## API Endpoints

- `GET /api/teams?league={league}&minGames={number}` - Get teams by criteria
- `POST /api/refresh` - Force refresh data for selected leagues

## License

MIT

No docker, supabase for DB
