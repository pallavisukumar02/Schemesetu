import { useState } from "react";

function isLocationSecureContext() {
  return window.isSecureContext || ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

export default function NearbyBanks() {
  const [state, setState] = useState({ loading: false, error: "", banks: [], coords: null, searched: false });
  const [manualLocation, setManualLocation] = useState("");
  const [radius, setRadius] = useState("5000");

  async function loadBanks(lat, lon) {
    setState(s => ({ ...s, loading: true, error: "", banks: [], coords: { lat, lon }, searched: false }));
    try {
      const response = await fetch(`/api/nearby/banks?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius=${radius}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not find nearby banks.");
      setState({ loading: false, error: "", banks: data.banks || [], coords: { lat, lon }, searched: true });
    } catch (error) {
      setState(s => ({ ...s, loading: false, error: error.message || "Could not find nearby banks.", searched: true }));
    }
  }

  function findBanks() {
    if (!isLocationSecureContext()) {
      setState(s => ({ ...s, error: "Your current address uses HTTP on a local network, which browsers block for GPS. Open the deployed HTTPS SchemeSetu link, or use the area/PIN-code search below." }));
      return;
    }
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "This browser does not support GPS location. Use the area/PIN-code search below." }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: "", banks: [], searched: false }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => loadBanks(coords.latitude, coords.longitude),
      (err) => {
        const message = err.code === 1
          ? "Location permission was denied. Allow Location in your browser's site settings, or search by area/PIN code below."
          : err.code === 2
            ? "Your device couldn't determine its location. Turn on device location services, or search by area/PIN code below."
            : "GPS timed out. Try again or search by area/PIN code below.";
        setState(s => ({ ...s, loading: false, error: message }));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  }

  async function searchManualLocation(event) {
    event.preventDefault();
    const query = manualLocation.trim();
    if (query.length < 3) {
      setState(s => ({ ...s, error: "Enter an area, city, or PIN code." }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: "", banks: [], searched: false }));
    try {
      const response = await fetch(`/api/nearby/geocode?q=${encodeURIComponent(query)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not find that location.");
      await loadBanks(data.lat, data.lon);
    } catch (error) {
      setState(s => ({ ...s, loading: false, error: error.message || "Location search failed." }));
    }
  }

  return <div className="max-w-4xl mx-auto px-5 py-12">
    <h1 className="font-display text-3xl mb-2">Nearby banks</h1>
    <p className="text-sm text-ink/60 max-w-prose mb-6">Find mapped bank branches around your current location. Your GPS location is requested only when you press the button. You can also search by area or PIN code.</p>

    <div className="flex flex-wrap items-center gap-3 mb-5">
      <button onClick={findBanks} disabled={state.loading} className="bg-ink text-paper rounded-card px-5 py-3 disabled:opacity-50">{state.loading ? "Finding banks…" : "Use my location"}</button>
      <label className="text-sm text-ink/70">Search radius
        <select value={radius} onChange={e => setRadius(e.target.value)} className="ml-2 border border-ink/20 rounded-lg px-3 py-2 bg-white text-ink">
          <option value="2000">2 km</option><option value="5000">5 km</option><option value="10000">10 km</option><option value="15000">15 km</option>
        </select>
      </label>
    </div>

    <form onSubmit={searchManualLocation} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
      <input value={manualLocation} onChange={e => setManualLocation(e.target.value)} placeholder="Enter area or PIN code (e.g. Yelahanka, Bengaluru)" aria-label="Area, city or PIN code" className="flex-1 min-w-0 border border-ink/20 rounded-card px-4 py-3 bg-white" />
      <button type="submit" disabled={state.loading} className="border border-ink/20 rounded-card px-5 py-3 disabled:opacity-50">Search this area</button>
    </form>

    {state.error && <p role="alert" className="text-sm text-rust mt-5">{state.error}</p>}
    {state.coords && <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
      <span className="text-ink/60">Showing banks within {Number(radius) / 1000} km of {state.coords.lat.toFixed(4)}, {state.coords.lon.toFixed(4)}</span>
      <a className="underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${state.coords.lat}&mlon=${state.coords.lon}#map=15/${state.coords.lat}/${state.coords.lon}`}>View search area on map</a>
    </div>}

    {state.loading && <p className="text-sm text-ink/60 mt-7" aria-live="polite">Finding mapped bank branches…</p>}
    <div className="mt-7 grid gap-4">
      {state.banks.map((bank, index) => <div key={`${bank.name}-${bank.lat}-${bank.lon}-${index}`} className="border border-ink/10 rounded-card p-4 bg-white/50 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0"><h2 className="font-display text-lg">{bank.name}</h2><p className="text-sm text-ink/60">{bank.address}</p><p className="text-xs text-ink/40 mt-1">About {bank.distance_km} km away{bank.phone ? ` · ${bank.phone}` : ""}</p></div>
        <a href={`https://www.google.com/maps/search/?api=1&query=${bank.lat},${bank.lon}`} target="_blank" rel="noreferrer" className="bg-marigold text-ink px-4 py-2 rounded-card text-sm font-medium">Open in Maps</a>
      </div>)}
      {!state.loading && state.searched && state.banks.length === 0 && !state.error && <div className="border border-ink/10 rounded-card p-5"><p className="text-sm text-ink/70">No bank branches were found in this radius in OpenStreetMap. Try a larger radius or search the area in Google Maps.</p><a className="inline-block mt-3 underline text-sm" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/banks+near+${state.coords.lat},${state.coords.lon}`}>Search banks on Google Maps</a></div>}
    </div>
    <p className="text-xs text-ink/40 mt-8">Bank locations are sourced from OpenStreetMap and may be incomplete or out of date. Confirm branch details and opening hours before visiting.</p>
  </div>;
}
