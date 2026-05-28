// Netlify Function — uses Node.js built-in https (no dependencies)
const https = require('https');

exports.handler = async function(event) {
  const p = event.queryStringParameters || {};
  let path;
  if (p.match)            path = `/Interclub/scores.aspx?match=${p.match}&dgu=1`;
  else if (p.competition) path = `/Interclub/scores.aspx?competition=${p.competition}&dgu=1`;
  else return { statusCode: 400, body: 'Need match or competition param' };

  return new Promise((resolve) => {
    const options = {
      hostname: 'tour.golfbox.dk',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'da-DK,da;q=0.9',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      // Handle redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        resolve({ statusCode: res.statusCode, body: 'Redirect: ' + res.headers.location });
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });

    req.on('error', (e) => resolve({ statusCode: 500, body: 'Request error: ' + e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ statusCode: 504, body: 'Timeout' }); });
    req.end();
  });
};
