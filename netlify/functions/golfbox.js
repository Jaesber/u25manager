const https = require('https');
const http  = require('http');

function fetch(url, redirects) {
  redirects = redirects || 0;
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'da-DK,da;q=0.9',
        'Connection': 'keep-alive',
      }
    }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const loc = res.headers.location.startsWith('http')
          ? res.headers.location
          : 'https://tour.golfbox.dk' + res.headers.location;
        res.resume();
        return fetch(loc, redirects + 1).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

exports.handler = async function(event) {
  const p = event.queryStringParameters || {};
  let url;
  if (p.match)            url = `https://tour.golfbox.dk/Interclub/scores.aspx?match=${p.match}&dgu=1`;
  else if (p.competition) url = `https://tour.golfbox.dk/Interclub/scores.aspx?competition=${p.competition}&dgu=1`;
  else return { statusCode: 400, body: 'Need match or competition param' };

  try {
    const { status, body } = await fetch(url);
    return {
      statusCode: status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body,
    };
  } catch(e) {
    return { statusCode: 500, body: 'Error: ' + e.message };
  }
};
