const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Scraper function (inlined)
async function scrapeLeagueData(url, leagueName, country, season) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive'
      }
    });
    const body = await res.text();
    const $ = cheerio.load(body);
    
    let teams = [];
    
    const mainTable = $('label[for="LTAB_1"]').next('div').find('#btable');
    
    if (mainTable.length === 0) {
      console.error('Could not find table with label LTAB_1');
      return { league: { name: leagueName, country: country, season: season, url: url }, teams: [] };
    }
    
    mainTable.find('tr').each((index, elem) => {
      const cells = $(elem).find('td');
      
      if (cells.length < 11 || $(elem).find('th').length > 0) return;
      
      const positionText = $(cells[0]).text().trim();
      const position = parseInt(positionText);
      
      if (isNaN(position) || positionText.toLowerCase().includes('average')) return;
      
      const teamName = $(cells[1]).text().trim();
      
      if (!teamName || teamName.length < 2) return;
      
      const gamesPlayed = parseInt($(cells[2]).text().trim()) || 0;
      const wins = parseInt($(cells[3]).text().trim()) || 0;
      const draws = parseInt($(cells[4]).text().trim()) || 0;
      const losses = parseInt($(cells[5]).text().trim()) || 0;
      
      const formCell = $(cells[10]);
      const formDivs = formCell.find('div');
      let formString = '';
      
      formDivs.each((i, div) => {
        const className = $(div).attr('class') || '';
        
        if (className.includes('dgreen')) {
          formString += 'W';
        } else if (className.includes('dorange')) {
          formString += 'D';
        } else if (className.includes('dred')) {
          formString += 'L';
        }
      });
      
      let noDrawStreak = 0;
      for (let char of formString) {
        if (char === 'D') break;
        if (char === 'W' || char === 'L') noDrawStreak++;
      }
      
      teams.push({
        name: teamName,
        position: position,
        total_games: gamesPlayed,
        wins: wins,
        draws: draws,
        losses: losses,
        form: formString,
        no_draw_streak: noDrawStreak,
        league_name: leagueName,
        country: country
      });
    });
    
    return {
      league: { name: leagueName, country: country, season: season, url: url },
      teams: teams
    };
  } catch (err) {
    console.error('Error scraping league data:', err);
    return null;
  }
}

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
