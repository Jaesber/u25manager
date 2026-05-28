// Netlify Function — Node 18 — uses native fetch
exports.handler = async function(event) {
  const p = event.queryStringParameters || {};
  let url;
  if (p.match)            url = `https://tour.golfbox.dk/Interclub/scores.aspx?match=${p.match}&dgu=1`;
  else if (p.competition) url = `https://tour.golfbox.dk/Interclub/scores.aspx?competition=${p.competition}&dgu=1`;
  else return { statusCode: 400, body: 'Need match or competition param' };

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)', 'Accept': 'text/html' }
    });
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
      body,
    };
  } catch(e) {
    return { statusCode: 500, body: 'Error: ' + e.message };
  }
};
