# Shortest-path map data

These compact street graphs contain OpenStreetMap data for central Poznań,
Warsaw, Paris, Berlin, London, New York, and Barcelona. They are stored locally
so the animation does not make network requests in the browser.

Each JSON file contains projected `[x, y]` node positions in meters and edges
encoded as `[from, to, distanceInMeters, roadTypeIndex]`. Only the largest
connected street component in each area is retained. Most maps extend
approximately 5 km in every direction from the city center. New York uses a
larger area centered on Manhattan so the whole island remains in view.

Source: © OpenStreetMap contributors, downloaded through the Overpass API.
The data is available under the [Open Data Commons Open Database License
(ODbL)](https://opendatacommons.org/licenses/odbl/). See the
[OpenStreetMap copyright page](https://www.openstreetmap.org/copyright) for
attribution and licensing details.

Regenerate the files from current OpenStreetMap data with:

```sh
node scripts/fetch-shortest-path-map-data.js --force
```

Pass city IDs after `--force` to regenerate only selected maps, for example:

```sh
node scripts/fetch-shortest-path-map-data.js --force london new-york
```
