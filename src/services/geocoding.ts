import { pool } from "../db/connection";

interface GeoResult {
  latitude: number;
  longitude: number;
  name: string;
}

async function callGeocodingApi(city: string): Promise<GeoResult> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);
  const data: any = await res.json();
  if (!data.results?.length) throw new Error(`City not found: ${city}`);
  const { latitude, longitude, name } = data.results[0];
  return { latitude, longitude, name };
}

export async function getOrCreateCity(city: string): Promise<{ id: number; name: string; latitude: number; longitude: number }> {
  const { rows } = await pool.query("SELECT id, name, latitude, longitude FROM cities WHERE LOWER(name) = $1", [city.toLowerCase()]);
  if (rows.length) return rows[0];

  const geo = await callGeocodingApi(city);
  const result = await pool.query(
    "INSERT INTO cities (name, latitude, longitude) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude RETURNING id, name, latitude, longitude",
    [geo.name, geo.latitude, geo.longitude]
  );
  return result.rows[0];
}