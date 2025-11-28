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

// In-memory cache with timestamp
let cache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 10 * 60 * 1000 // 10 minutes
};

async function getAllTeamsData(forceRefresh = false) {
  // Check if cache is valid
  if (!forceRefresh && cache.data && cache.timestamp && (Date.now() - cache.timestamp < cache.CACHE_DURATION)) {
    console.log('Returning cached data');
    return cache.data;
  }

  console.log('Scraping fresh data...');
  const allTeams = [];

  // Scrape all leagues in parallel
  const promises = leagues.map(league => 
    scrapeLeagueData(league.url, league.name, league.country, league.season)
  );

  const results = await Promise.all(promises);

  // Combine all teams
  results.forEach(result => {
    if (result && result.teams && result.teams.length > 0) {
      allTeams.push(...result.teams);
    }
  });

  // Update cache
  cache.data = allTeams;
  cache.timestamp = Date.now();

  return allTeams;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { league = 'all', minGames = 0 } = req.query;
    const minStreak = parseInt(minGames) || 0;

    // Get all teams data (cached or fresh)
    const allTeams = await getAllTeamsData();

    // Filter teams
    let filteredTeams = allTeams.filter(team => team.no_draw_streak >= minStreak);

    // Filter by league if specified
    if (league && league !== 'all') {
      filteredTeams = filteredTeams.filter(team => team.league_name === league);
    }

    // Sort by streak (desc) then position (asc)
    filteredTeams.sort((a, b) => {
      if (b.no_draw_streak !== a.no_draw_streak) {
        return b.no_draw_streak - a.no_draw_streak;
      }
      return a.position - b.position;
    });

    res.status(200).json({
      league: league,
      minGames: minStreak,
      teams: filteredTeams,
      cached: cache.timestamp ? new Date(cache.timestamp).toISOString() : null
    });
  } catch (error) {
    console.error('Error in /api/teams:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teams data',
      message: error.message 
    });
  }
};
