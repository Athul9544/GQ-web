#!/usr/bin/env node
/**
 * Refresh assets/data/reviews.json from the live Google Places API.
 *
 *   set GOOGLE_MAPS_API_KEY=your_key
 *   node tools/fetch-reviews.js
 *
 * Optional: set GOOGLE_PLACE_ID to skip the lookup step.
 *
 * Notes worth knowing before you rely on this:
 *   - Google returns a maximum of 5 reviews per place. There is no API that
 *     returns all of them; the total count is still reported accurately.
 *   - Run this on a server or a schedule, never in the browser: the key must
 *     not ship in client-side code.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const SEARCH_FOR = 'Golden Qube Digital Marketing Academy, Chakkaraparambu, Cochin';
const OUT = path.join(__dirname, '..', 'assets', 'data', 'reviews.json');

if (!KEY) {
  console.error('GOOGLE_MAPS_API_KEY is not set.\n' +
    'Create a key in Google Cloud with the "Places API (New)" enabled, then:\n' +
    '  set GOOGLE_MAPS_API_KEY=...   (Windows)\n' +
    '  export GOOGLE_MAPS_API_KEY=...  (macOS/Linux)');
  process.exit(1);
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          res.statusCode >= 400
            ? reject(new Error(`HTTP ${res.statusCode}: ${json.error?.message || data}`))
            : resolve(json);
        } catch (e) { reject(new Error(`bad response: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function findPlaceId() {
  const body = JSON.stringify({ textQuery: SEARCH_FOR });
  const res = await request({
    hostname: 'places.googleapis.com',
    path: '/v1/places:searchText',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
    }
  }, body);

  const place = (res.places || [])[0];
  if (!place) throw new Error(`no place found for "${SEARCH_FOR}"`);
  console.log(`matched: ${place.displayName?.text} — ${place.formattedAddress}`);
  console.log(`place id: ${place.id}  (set GOOGLE_PLACE_ID to skip this lookup)`);
  return place.id;
}

async function fetchPlace(id) {
  return request({
    hostname: 'places.googleapis.com',
    // Ask for newest first; without this Google returns "most relevant".
    path: `/v1/places/${id}?languageCode=en`,
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,reviews'
    }
  });
}

(async () => {
  try {
    const id = PLACE_ID || (await findPlaceId());
    const place = await fetchPlace(id);

    const reviews = (place.reviews || []).map(r => ({
      author: r.authorAttribution?.displayName || 'Google user',
      avatar: r.authorAttribution?.photoUri || null,
      time: r.publishTime ? Math.floor(new Date(r.publishTime).getTime() / 1000) : null,
      rating: r.rating || 5,
      text: (r.originalText?.text || r.text?.text || '').trim()
    })).filter(r => r.text);

    if (!reviews.length) {
      console.error('Google returned no review text — leaving the existing file untouched.');
      process.exit(1);
    }

    // Newest first, so the carousel leads with the latest review.
    reviews.sort((a, b) => (b.time || 0) - (a.time || 0));

    const data = {
      source: 'google',
      place: place.displayName?.text || SEARCH_FOR,
      placeId: place.id,
      rating: place.rating || 5,
      totalReviews: place.userRatingCount || reviews.length,
      verdict: (place.rating || 5) >= 4.5 ? 'EXCELLENT' : 'GREAT',
      fetchedAt: new Date().toISOString(),
      reviews
    };

    fs.writeFileSync(OUT, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\nwrote ${path.relative(process.cwd(), OUT)}`);
    console.log(`  rating ${data.rating} from ${data.totalReviews} reviews`);
    console.log(`  ${reviews.length} review texts (Google caps this at 5)`);
    reviews.forEach(r => console.log(`    ${r.author} — ${new Date(r.time * 1000).toISOString().slice(0, 10)}`));
  } catch (err) {
    console.error('failed:', err.message);
    console.error('The existing reviews.json was left unchanged.');
    process.exit(1);
  }
})();
