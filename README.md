# Tube Map Maker: shared maps

A public collection of maps for [Tube Map Maker](https://github.com/rawritscloud/jmf-tubemaps). The app's **Browse maps** screen reads `index.json` from this repository and opens any map as the visitor's own copy. Nothing here is ever changed by the app.

## Adding a map

1. In Tube Map Maker, open **Settings > Download map file**. You get a `.json` file.
2. Put just that file in `maps/`, with a short lowercase name, for example `maps/my-city.json`.
3. Open a pull request.

That's it: once it's merged, a GitHub Action (`tools/build-index.js`) generates the thumbnail and adds an `index.json` entry for you, titled and described from the map itself. If you'd like a better title, description or credit than the defaults, edit the `title`, `about` or `by` field in `index.json` afterwards in a normal pull request — the action leaves an existing entry's wording alone and only keeps `file`/`thumb` correct and the thumbnail in sync with the map.

## Rules

- Only maps you made or have the right to share.
- Keep a map under 2 MB. File names use letters, numbers, `-` and `_` only, and sit inside `maps/`.
- No personal information in names or text. Anyone can read and copy what is here.
- Maps are reviewed before they are added, and may be removed on request.

## Sources and licences

Maps built by the app's author from open data are listed here with where the data came from. They are **unofficial schematic drawings**, not affiliated with or endorsed by any transport operator. Station names and connections are facts; the drawings are our own. Positions are laid out from real coordinates and then snapped to a grid, so they are a starting point for editing, not an official diagram.

| Map | Data | Notes |
| --- | --- | --- |
| London | Transport for London Unified API (`api.tfl.gov.uk`), the Underground, Elizabeth line, DLR, London Overground lines and London Trams. **Powered by TfL Open Data.** Contains OS data © Crown copyright and database rights 2016 and Geomni UK Map data © and database rights [2019]. | Line colours are TfL's published colours. Branches follow TfL's route sequences, so a few outer Elizabeth line stations (to Reading) are included. Built with `tools/fetch-tfl.js` and `tools/build-map.js` in the app repository. |
| Walt Disney World | Route and stop data © OpenStreetMap contributors, available under the [Open Database Licence](https://www.openstreetmap.org/copyright). | Monorail, Skyliner, railroad and boat links and positions come from OpenStreetMap. The resort bus network is a **simplification** (every resort on one ring road, a spur to each park) because Disney's bus routes are not in open data; check Disney for real routes. A hand-placed schematic (`tools/specs/disney-resort.json` in the app repository). **Unofficial; not affiliated with or endorsed by The Walt Disney Company.** |
| Washington Metro | Route and stop data © OpenStreetMap contributors ([ODbL](https://www.openstreetmap.org/copyright)). | Built with `tools/fetch-osm.js` and `tools/build-map.js`. A few stations may be missing where OpenStreetMap's route relations are incomplete. Unofficial; not affiliated with WMATA. |
| Vancouver SkyTrain | Route and stop data © OpenStreetMap contributors ([ODbL](https://www.openstreetmap.org/copyright)). | Built with `tools/fetch-osm.js` and `tools/build-map.js`. Unofficial; not affiliated with TransLink. |
| The Relationship Line | None: invented for fun. | A joke map; any resemblance to your own relationship is coincidental. |
