#!/usr/bin/env node
'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function debugMatchStructure() {
  const url = 'https://www.soccerstats.com/latest.asp?league=greece';
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const body = await res.text();
  const $ = cheerio.load(body);
  
  console.log('Looking for upcoming match rows...\n');
  
  let count = 0;
  $('table tr').each((index, elem) => {
    const cells = $(elem).find('td');
    if (cells.length < 2) return;
    
    const firstCell = $(cells[0]).text().trim();
    
    // Look for date pattern
    if (firstCell.match(/^[A-Za-z]{3}\s+\d+\s+[A-Za-z]{3}/)) {
      count++;
      console.log(`\n--- Row ${count} ---`);
      console.log(`Cell 0: "${firstCell}"`);
      
      for (let i = 1; i < Math.min(cells.length, 5); i++) {
        console.log(`Cell ${i}: "${$(cells[i]).text().trim()}"`);
        console.log(`  HTML: ${$(cells[i]).html()?.substring(0, 100)}`);
      }
      
      if (count >= 5) return false; // Stop after 5 matches
    }
  });
}

debugMatchStructure().catch(console.error);
