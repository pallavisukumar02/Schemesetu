const express = require("express");
const router = express.Router();

const USER_AGENT = "SchemeSetu/1.1 (nearby bank finder; contact: support@schemesetu.app)";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

function distanceKm(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLon = (bLon - aLon) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function validCoordinates(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Address fallback for users whose browser/device cannot provide GPS coordinates.
router.get("/geocode", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 3 || q.length > 160) return res.status(400).json({ error: "Enter a location with at least 3 characters." });
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "in");
    const response = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" } });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const results = await response.json();
    if (!results.length) return res.status(404).json({ error: "We couldn't find that location. Try a locality, area, or PIN code." });
    res.json({ lat: Number(results[0].lat), lon: Number(results[0].lon), display_name: results[0].display_name });
  } catch (error) {
    console.error("location geocoding:", error.message);
    res.status(502).json({ error: "The location search service is temporarily unavailable. Please try GPS location or try again shortly." });
  }
});

router.get("/banks", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Math.min(15000, Math.max(500, Number(req.query.radius) || 5000));
  if (!validCoordinates(lat, lon)) return res.status(400).json({ error: "Valid latitude and longitude are required." });

  // Overpass searches actual OpenStreetMap bank features within a radius. Unlike
  // Nominatim's text search, this is a proximity query and includes mapped branches.
  const query = `[out:json][timeout:15];(node[\"amenity\"=\"bank\"](around:${radius},${lat},${lon});way[\"amenity\"=\"bank\"](around:${radius},${lat},${lon});relation[\"amenity\"=\"bank\"](around:${radius},${lat},${lon}););out center tags;`;
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": USER_AGENT },
        body: new URLSearchParams({ data: query }).toString()
      }, 18000);
      if (!response.ok) throw new Error(`Map service returned ${response.status}`);
      const payload = await response.json();
      const seen = new Set();
      const banks = (payload.elements || []).map((item) => {
        const bankLat = Number(item.lat ?? item.center?.lat);
        const bankLon = Number(item.lon ?? item.center?.lon);
        const tags = item.tags || {};
        if (!validCoordinates(bankLat, bankLon)) return null;
        const name = tags.name || tags.brand || tags.operator || "Bank branch";
        const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean);
        const address = addressParts.join(", ") || tags["addr:full"] || tags["addr:place"] || "Address not listed on OpenStreetMap";
        const key = `${name.toLowerCase()}|${bankLat.toFixed(5)}|${bankLon.toFixed(5)}`;
        if (seen.has(key)) return null;
        seen.add(key);
        return { name, address, lat: bankLat, lon: bankLon, distance_km: Number(distanceKm(lat, lon, bankLat, bankLon).toFixed(2)), brand: tags.brand || null, phone: tags.phone || tags["contact:phone"] || null };
      }).filter(Boolean).sort((a, b) => a.distance_km - b.distance_km).slice(0, 20);
      return res.json({ banks, radius_m: radius, source: "OpenStreetMap", count: banks.length });
    } catch (error) {
      lastError = error;
      console.warn("Overpass endpoint failed:", endpoint, error.message);
    }
  }
  console.error("nearby banks lookup failed:", lastError?.message);
  return res.status(502).json({ error: "The nearby bank map service is temporarily busy. Please try again in a minute, or open Google Maps to search for banks." });
});

module.exports = router;
