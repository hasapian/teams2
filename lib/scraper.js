'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');

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
    
    // SoccerStats.com - find the table inside div that follows label[for="LTAB_1"]
    const mainTable = $('label[for="LTAB_1"]').next('div').find('#btable');
    
    if (mainTable.length === 0) {
      console.error('Could not find table with label LTAB_1');
      return { league: { name: leagueName, country: country, season: season, url: url }, teams: [] };
    }
    
    mainTable.find('tr').each((index, elem) => {
      const cells = $(elem).find('td');
      
      // Skip rows without enough cells or rows with th (headers)
      if (cells.length < 11 || $(elem).find('th').length > 0) return;
      
      // Extract data from columns
      const positionText = $(cells[0]).text().trim();
      const position = parseInt(positionText);
      
      // Skip header rows, footer rows (like "Average"), and non-numeric positions
      if (isNaN(position) || positionText.toLowerCase().includes('average')) return;
      
      const teamName = $(cells[1]).text().trim();
      
      // Skip if team name is empty
      if (!teamName || teamName.length < 2) return;
      
      const gamesPlayed = parseInt($(cells[2]).text().trim()) || 0;
      const wins = parseInt($(cells[3]).text().trim()) || 0;
      const draws = parseInt($(cells[4]).text().trim()) || 0;
      const losses = parseInt($(cells[5]).text().trim()) || 0;
      
      // Form column (11th column, index 10) - contains divs with classes
      // dgreen = Win, dorange = Draw, dred = Loss
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
      
      // Calculate no-draw streak from form (most recent games first)
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

module.exports = { scrapeLeagueData };
