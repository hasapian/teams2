#!/usr/bin/env node
'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Configuration for leagues to check
const LEAGUES = [
  {
    url: 'https://www.soccerstats.com/latest.asp?league=greece',
    name: 'Super League',
    country: 'Greece'
  },
  {
    url: 'https://www.soccerstats.com/latest.asp?league=england',
    name: 'Premier League',
    country: 'England'
  },
  {
    url: 'https://www.soccerstats.com/latest.asp?league=spain',
    name: 'La Liga',
    country: 'Spain'
  },
  {
    url: 'https://www.soccerstats.com/latest.asp?league=italy',
    name: 'Serie A',
    country: 'Italy'
  },
  {
    url: 'https://www.soccerstats.com/latest.asp?league=germany',
    name: 'Bundesliga',
    country: 'Germany'
  }
];

/**
 * Parse date string from soccerstats.com format
 * Examples: "Sat 6 Dec 18:30", "Sun 7 Dec 15:00", "Mon 8 Dec 16:00"
 */
function parseMatchDate(dateStr, timeStr) {
  const currentYear = new Date().getFullYear();
  
  // Parse day name and date
  const parts = dateStr.trim().split(' ');
  if (parts.length < 3) return null;
  
  const dayNum = parseInt(parts[1]);
  const monthStr = parts[2];
  
  // Month mapping
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const month = months[monthStr];
  if (month === undefined) return null;
  
  // Parse time
  const timeParts = timeStr.trim().split(':');
  const hours = parseInt(timeParts[0]) || 0;
  const minutes = parseInt(timeParts[1]) || 0;
  
  // Create date object
  const matchDate = new Date(currentYear, month, dayNum, hours, minutes);
  
  // If the date is in the past (early months), assume next year
  const now = new Date();
  if (matchDate < now && month < 6) {
    matchDate.setFullYear(currentYear + 1);
  }
  
  return matchDate;
}

/**
 * Scrape upcoming matches for a specific team
 */
async function findNextMatch(teamName, leagueUrl) {
  try {
    const res = await fetch(leagueUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive'
      }
    });
    
    const body = await res.text();
    const $ = cheerio.load(body);
    
    const upcomingMatches = [];
    const now = new Date();
    
    // Find upcoming matches in the fixtures table
    // Look for tables with upcoming matches (typically have date/time in first column)
    $('table tr').each((index, elem) => {
      const cells = $(elem).find('td');
      if (cells.length < 2) return;
      
      const firstCell = $(cells[0]).text().trim();
      
      // Check if this looks like a fixture row (has date/time and team names)
      // Format: "Sat 6 Dec 18:30" or "Sat 6 Dec\n18:30" in first cell
      if (firstCell.match(/^[A-Za-z]{3}\s+\d+\s+[A-Za-z]{3}/)) {
        // Extract date and time
        let dateStr = firstCell;
        let timeStr = '';
        
        // Check if time is in the same cell (could be on new line)
        const timeMatch = firstCell.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) {
          timeStr = timeMatch[1];
          dateStr = firstCell.replace(timeStr, '').trim();
        }
        
        // Skip if no time (completed matches)
        if (!timeStr) return;
        
        // Get team names from second cell
        // Teams are typically separated by <br> tag or " - "
        let homeTeam = '';
        let awayTeam = '';
        
        if (cells.length >= 2) {
          const secondCellHtml = $(cells[1]).html();
          const secondCellText = $(cells[1]).text().trim();
          
          // Check for <br> separator (upcoming matches)
          if (secondCellHtml && secondCellHtml.includes('<br>')) {
            const teams = secondCellHtml.split(/<br\s*\/?>/i);
            if (teams.length >= 2) {
              // Use cheerio to parse and remove any HTML tags
              homeTeam = $('<div>').html(teams[0]).text().trim();
              awayTeam = $('<div>').html(teams[1]).text().trim();
            }
          }
          // Check for " - " separator (completed matches or alternative format)
          else if (secondCellText.includes(' - ')) {
            const teams = secondCellText.split(' - ');
            homeTeam = teams[0].trim();
            awayTeam = teams[1].trim();
          }
        }
        
        // Only process if we found both teams
        if (!homeTeam || !awayTeam) return;
        
        // Check if the target team is playing
        const teamLower = teamName.toLowerCase();
        const isMatch = homeTeam.toLowerCase().includes(teamLower) || 
                       awayTeam.toLowerCase().includes(teamLower);
        
        if (isMatch) {
          const matchDate = parseMatchDate(dateStr, timeStr);
          
          if (matchDate && matchDate > now) {
            upcomingMatches.push({
              date: matchDate,
              dateStr: dateStr,
              time: timeStr,
              homeTeam: homeTeam,
              awayTeam: awayTeam
            });
          }
        }
      }
    });
    
    // Sort by date and return the earliest
    if (upcomingMatches.length > 0) {
      upcomingMatches.sort((a, b) => a.date - b.date);
      return upcomingMatches[0];
    }
    
    return null;
  } catch (err) {
    console.error(`Error scraping ${leagueUrl}:`, err.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node check-next-match.js <team-name>');
    console.error('Example: node check-next-match.js Volos');
    process.exit(1);
  }
  
  const teamName = args.join(' ');
  console.log(`Checking next match for: ${teamName}`);
  console.log('Searching across all leagues...\n');
  
  let foundMatch = null;
  let foundLeague = null;
  
  // Search all leagues
  for (const league of LEAGUES) {
    console.log(`Checking ${league.name} (${league.country})...`);
    const match = await findNextMatch(teamName, league.url);
    
    if (match) {
      // Keep the earliest match
      if (!foundMatch || match.date < foundMatch.date) {
        foundMatch = match;
        foundLeague = league;
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (foundMatch) {
    const now = new Date();
    const daysUntilMatch = Math.ceil((foundMatch.date - now) / (1000 * 60 * 60 * 24));
    
    console.log('✅ NEXT MATCH FOUND');
    console.log('='.repeat(60));
    console.log(`League:      ${foundLeague.name} (${foundLeague.country})`);
    console.log(`Match:       ${foundMatch.homeTeam} vs ${foundMatch.awayTeam}`);
    console.log(`Date:        ${foundMatch.dateStr}`);
    console.log(`Time:        ${foundMatch.time}`);
    console.log(`Full Date:   ${foundMatch.date.toLocaleString()}`);
    console.log(`Days until:  ${daysUntilMatch} day(s)`);
    console.log('='.repeat(60));
    
    // Exit code based on days until match
    // 0 = match tomorrow (send notification)
    // 1 = match not tomorrow
    if (daysUntilMatch === 1) {
      console.log('🔔 NOTIFICATION: Match is TOMORROW!');
      process.exit(0);
    } else {
      console.log(`ℹ️  Match is in ${daysUntilMatch} days (no notification needed)`);
      process.exit(1);
    }
  } else {
    console.log('❌ NO UPCOMING MATCH FOUND');
    console.log(`No upcoming fixtures found for "${teamName}" in any league.`);
    console.log('='.repeat(60));
    process.exit(2);
  }
}

// Run the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(3);
});
