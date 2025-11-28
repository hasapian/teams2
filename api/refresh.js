const { scrapeLeagueData } = require('../lib/scraper');

// Configuration for leagues to scrape
const leagues = [
  {
    url: 'https://www.soccerstats.com/latest.asp?league=greece',
    name: 'Super League',
    country: 'Greece',
    season: '2024-2025'
  },
  {
    url: 'https://www.soccerstats.com/latest.asp?league=england',
    name: 'Premier League',
    country: 'England',
    season: '2024-2025'
  },
  {
    url: 'https://www.soccerstats.com/latest.asp?league=spain',
    name: 'La Liga',
    country: 'Spain',
    season: '2024-2025'
  },
  {
    url: 'https://www.soccerstats.com/latest.asp?league=italy',
    name: 'Serie A',
    country: 'Italy',
    season: '2024-2025'
  },
  {
    url: 'https://www.soccerstats.com/latest.asp?league=germany',
    name: 'Bundesliga',
    country: 'Germany',
    season: '2024-2025'
  }
];

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let selectedLeagues = [];
    
    // Parse request body if present
    if (req.body && req.body.leagues) {
      selectedLeagues = req.body.leagues;
    } else {
      // Default to all leagues
      selectedLeagues = leagues.map(l => l.name);
    }

    console.log(`Refreshing data for: ${selectedLeagues.join(', ')}`);

    // Filter leagues to scrape
    const leaguesToScrape = leagues.filter(l => selectedLeagues.includes(l.name));

    // Scrape selected leagues in parallel
    const promises = leaguesToScrape.map(league => 
      scrapeLeagueData(league.url, league.name, league.country, league.season)
    );

    const results = await Promise.all(promises);

    let totalTeams = 0;
    results.forEach(result => {
      if (result && result.teams) {
        totalTeams += result.teams.length;
      }
    });

    res.status(200).json({ 
      message: 'Refresh completed',
      status: 'success',
      leagues: selectedLeagues,
      totalTeams: totalTeams
    });
  } catch (error) {
    console.error('Error in /api/refresh:', error);
    res.status(500).json({ 
      error: 'Failed to refresh data',
      message: error.message 
    });
  }
};
