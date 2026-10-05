'use strict';

/*
 * Download and compact OpenStreetMap street graphs used by the
 * shortest-path-map animation.
 *
 * Run with: node scripts/fetch-shortest-path-map-data.js
 */

const fs = require('fs/promises');
const path = require('path');

const OVERPASS_URLS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'map-data', 'shortest-path');
const RADIUS_METERS = 5000;

const CITIES = [
    {id: 'poznan', name: 'Poznań', lat: 52.4064, lon: 16.9252},
    {id: 'warsaw', name: 'Warsaw', lat: 52.2297, lon: 21.0122},
    {id: 'paris', name: 'Paris', lat: 48.8566, lon: 2.3522},
    {id: 'berlin', name: 'Berlin', lat: 52.5200, lon: 13.4050},
    {id: 'london', name: 'London', lat: 51.5074, lon: -0.1278},
    {id: 'new-york', name: 'New York', lat: 40.7893, lon: -73.9690, latRadiusMeters: 11000, lonRadiusMeters: 22000},
    {id: 'barcelona', name: 'Barcelona', lat: 41.3874, lon: 2.1686},
];

const ROAD_TYPES = [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
    'unclassified', 'residential', 'living_street', 'pedestrian', 'service',
];

function boundingBox(city) {
    const latRadiusMeters = city.latRadiusMeters || RADIUS_METERS,
          lonRadiusMeters = city.lonRadiusMeters || RADIUS_METERS,
          latDelta = latRadiusMeters / 110540,
          lonDelta = lonRadiusMeters / (111320 * Math.cos(city.lat * Math.PI / 180));
    return [
        city.lat - latDelta,
        city.lon - lonDelta,
        city.lat + latDelta,
        city.lon + lonDelta,
    ];
}

function createQuery(city) {
    const bbox = boundingBox(city).map(value => value.toFixed(6)).join(',');
    const roadPattern = `^(${ROAD_TYPES.join('|')})$`;
    return `[out:json][timeout:180];
        way["highway"~"${roadPattern}"](${bbox})
            ["area"!="yes"]
            ["service"!~"^(parking_aisle|driveway|drive-through)$"];
        (._;>;);
        out body;`;
}

async function download(city) {
    let lastError = null;
    for (const url of OVERPASS_URLS) {
        try {
            process.stdout.write(`\n  trying ${new URL(url).hostname}... `);
            const response = await fetch(url, {
                method: 'POST',
                signal: AbortSignal.timeout(90000),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'User-Agent': 'mwydmuch.github.io shortest-path map data builder',
                },
                body: new URLSearchParams({data: createQuery(city)}),
            });
            if (response.ok) {
                console.log('ok');
                return response.json();
            }
            lastError = new Error(`${url} returned ${response.status} ${response.statusText}`);
            console.log(`${response.status}`);
        } catch (error) {
            lastError = error;
            console.log(error.message);
        }
    }
    throw new Error(`${city.name}: all Overpass endpoints failed (${lastError.message})`);
}

function project(city, lat, lon) {
    return [
        Math.round((lon - city.lon) * 111320 * Math.cos(city.lat * Math.PI / 180)),
        Math.round((city.lat - lat) * 110540),
    ];
}

function largestConnectedComponent(nodeCount, edges) {
    const adjacency = Array.from({length: nodeCount}, () => []);
    for (const edge of edges) {
        adjacency[edge[0]].push(edge[1]);
        adjacency[edge[1]].push(edge[0]);
    }

    const seen = new Uint8Array(nodeCount);
    let largest = [];
    for (let root = 0; root < nodeCount; ++root) {
        if (seen[root] || adjacency[root].length === 0) continue;
        const component = [];
        const stack = [root];
        seen[root] = 1;
        while (stack.length > 0) {
            const node = stack.pop();
            component.push(node);
            for (const next of adjacency[node]) {
                if (!seen[next]) {
                    seen[next] = 1;
                    stack.push(next);
                }
            }
        }
        if (component.length > largest.length) largest = component;
    }
    return new Set(largest);
}

function compact(city, osm) {
    const osmNodes = new Map();
    const ways = [];
    for (const element of osm.elements) {
        if (element.type === 'node') osmNodes.set(element.id, [element.lat, element.lon]);
        else if (element.type === 'way' && element.nodes && element.tags && element.tags.highway) ways.push(element);
    }

    const usedOsmNodeIds = new Set();
    for (const way of ways) {
        for (const nodeId of way.nodes) {
            if (osmNodes.has(nodeId)) usedOsmNodeIds.add(nodeId);
        }
    }

    const osmToGraph = new Map();
    const allNodes = [];
    for (const osmNodeId of usedOsmNodeIds) {
        const coordinate = osmNodes.get(osmNodeId);
        osmToGraph.set(osmNodeId, allNodes.length);
        allNodes.push(project(city, coordinate[0], coordinate[1]));
    }

    const typeToIndex = new Map(ROAD_TYPES.map((type, index) => [type, index]));
    const edgeByPair = new Map();
    for (const way of ways) {
        const type = typeToIndex.get(way.tags.highway);
        for (let i = 1; i < way.nodes.length; ++i) {
            const from = osmToGraph.get(way.nodes[i - 1]);
            const to = osmToGraph.get(way.nodes[i]);
            if (from === undefined || to === undefined || from === to) continue;
            const pair = from < to ? `${from}:${to}` : `${to}:${from}`;
            const dx = allNodes[from][0] - allNodes[to][0];
            const dy = allNodes[from][1] - allNodes[to][1];
            const distance = Math.max(1, Math.round(Math.hypot(dx, dy)));
            const edge = [from, to, distance, type];
            const previous = edgeByPair.get(pair);
            if (!previous || type < previous[3]) edgeByPair.set(pair, edge);
        }
    }

    const allEdges = Array.from(edgeByPair.values());
    const component = largestConnectedComponent(allNodes.length, allEdges);
    const oldToNew = new Map();
    const nodes = [];
    for (const oldIndex of component) {
        oldToNew.set(oldIndex, nodes.length);
        nodes.push(allNodes[oldIndex]);
    }
    const edges = allEdges
        .filter(edge => component.has(edge[0]) && component.has(edge[1]))
        .map(edge => [oldToNew.get(edge[0]), oldToNew.get(edge[1]), edge[2], edge[3]]);

    const boundsMeters = [Infinity, Infinity, -Infinity, -Infinity];
    for (const node of nodes) {
        boundsMeters[0] = Math.min(boundsMeters[0], node[0]);
        boundsMeters[1] = Math.min(boundsMeters[1], node[1]);
        boundsMeters[2] = Math.max(boundsMeters[2], node[0]);
        boundsMeters[3] = Math.max(boundsMeters[3], node[1]);
    }
    return {
        city: city.name,
        center: [city.lat, city.lon],
        radiusMeters: Math.max(city.latRadiusMeters || RADIUS_METERS, city.lonRadiusMeters || RADIUS_METERS),
        latRadiusMeters: city.latRadiusMeters || RADIUS_METERS,
        lonRadiusMeters: city.lonRadiusMeters || RADIUS_METERS,
        boundsMeters,
        generatedAt: new Date().toISOString(),
        source: 'OpenStreetMap via Overpass API',
        sourceUrl: 'https://www.openstreetmap.org/copyright',
        license: 'Open Data Commons Open Database License (ODbL)',
        roadTypes: ROAD_TYPES,
        nodes,
        edges,
    };
}

async function main() {
    await fs.mkdir(OUTPUT_DIR, {recursive: true});
    const force = process.argv.includes('--force');
    const requestedCityIds = process.argv.slice(2).filter(argument => !argument.startsWith('--')),
          requestedCities = requestedCityIds.length === 0 ? CITIES : CITIES.filter(city => requestedCityIds.includes(city.id));
    if(requestedCities.length !== (requestedCityIds.length || CITIES.length)) {
        throw new Error(`Unknown city id; expected one of: ${CITIES.map(city => city.id).join(', ')}`);
    }
    for (const city of requestedCities) {
        const outputPath = path.join(OUTPUT_DIR, `${city.id}.json`);
        if (!force) {
            try {
                await fs.access(outputPath);
                console.log(`Skipping ${city.name}; ${city.id}.json already exists`);
                continue;
            } catch (error) {
                // The file does not exist yet.
            }
        }
        process.stdout.write(`Downloading ${city.name}... `);
        const osm = await download(city);
        const graph = compact(city, osm);
        await fs.writeFile(outputPath, `${JSON.stringify(graph)}\n`);
        console.log(`${graph.nodes.length} nodes, ${graph.edges.length} edges`);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
