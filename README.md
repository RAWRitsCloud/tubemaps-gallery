# Tube Map Maker: shared maps

A public collection of maps for [Tube Map Maker](https://github.com/rawritscloud/jmf-tubemaps). The app's **Browse maps** screen reads `index.json` from this repository and opens any map as the visitor's own copy. Nothing here is ever changed by the app.

## Adding a map

1. In Tube Map Maker, open **Settings > Download map file**. You get a `.json` file. Optionally also **Export vector (SVG)** for the thumbnail.
2. Put the file in `maps/` with a short lowercase name, for example `maps/my-city.json` (and `maps/my-city.svg`).
3. Add an entry to `index.json`:

   ```json
   { "id": "my-city", "title": "My City", "by": "Your name", "about": "One line about it", "file": "maps/my-city.json", "thumb": "maps/my-city.svg" }
   ```

4. Open a pull request. 

## Rules

- Only maps you made or have the right to share. Say who made it in `by`.
- Keep a map under 2 MB. File names use letters, numbers, `-`, `_` and `.` only, and sit inside `maps/`.
- No personal information in names or text. Anyone can read and copy what is here.
- Maps are reviewed before they are added, and may be removed on request.
