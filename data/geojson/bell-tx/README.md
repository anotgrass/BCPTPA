# Bell County GeoJSON Snapshot Contract

This directory holds offline snapshot files produced for **local admin
preview** (the public site uses live ArcGIS services only). Snapshots are
taken **once per year** and live in a `YYYY/` subfolder so history is
preserved without file duplication.

**Git:** `*.geojson`, `manifest.json`, and `README.md` under `data/geojson/`
are gitignored so snapshot exports stay local. Only `schema.json` (and
similar small contract files) is meant to be committed.

## Admin preview in the browser

Serve the repo over HTTP, then open the app with:

`http://127.0.0.1:8000/?adminGeojson=1`

This enables the GeoJSON adapter for the current session only; it is
**not** exposed in the UI. Requires `manifest.json` and the
`YYYY/*.geojson` files from the downloader.

## Layout

```
data/geojson/bell-tx/
├── manifest.json             # points the app at the latest year
├── README.md
├── schema.json
├── 2025/
│   ├── parcels.geojson
│   ├── market-analysis.geojson
│   └── sales.geojson
└── 2026/
    ├── parcels.geojson
    ├── market-analysis.geojson
    └── sales.geojson
```

Running the downloader re-uses the current year's folder and overwrites
the three files in place, so there is always exactly one snapshot set
per year.

## Required Files (per year folder)

- `parcels.geojson`
- `market-analysis.geojson`
- `sales.geojson`

Each file must be a valid GeoJSON `FeatureCollection`.

## manifest.json

`manifest.json` is rewritten by `scripts/download_arcgis_geojson.py`
every run. When `?adminGeojson=1` is used, the app (`data/adapters.js` →
`createGeoJsonSource`) reads it to decide which year folder to load from.

```json
{
  "county": "bell-tx",
  "label": "Bell County, TX",
  "latest": "2026",
  "years": ["2025", "2026"],
  "layers": {
    "parcels": "parcels.geojson",
    "market-analysis": "market-analysis.geojson",
    "sales": "sales.geojson"
  },
  "updated": "2026-04-22T17:45:00Z"
}
```

If `manifest.json` is missing (e.g. brand-new checkout before the
first download), the app falls back to the flat layout
(`./data/geojson/bell-tx/<file>.geojson`).

## Canonical Matching Keys

- Parcel ID key: `PROP_ID` (or `prop_id`) is preferred.
- Neighborhood key: `Neighborhood` (or `neighborhood`).
- City key: `situs_city` / `SITUS_CITY`.

## Notes

- Property fields can be provided in either ArcGIS-style `attributes` or GeoJSON-style `properties`.
- The app normalizer accepts known Bell aliases (upper/lower/snake/camel variants used in live services).
- `sales.geojson` does not need address, but `market-analysis.geojson` should include address by `PROP_ID` so sold rows can display it.

## Annual refresh workflow

1. `pip install -r scripts/requirements.txt` (once).
2. `python scripts/download_arcgis_geojson.py --county bell-tx`
   - Writes/overwrites `data/geojson/bell-tx/<current-year>/*.geojson`.
   - Updates `manifest.json` so the app picks up the new year.
3. Commit the new/updated year folder + `manifest.json`.
4. Push — the GitHub Pages deploy workflow copies `data/**` into `_site/`.

Pass `--year 2027` to back-fill or pre-stage a specific year.
