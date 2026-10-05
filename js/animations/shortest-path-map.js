'use strict';

const NAME = 'shortest path on a real city map',
      FILE = 'shortest-path-map.js',
      DESC = `
Animation showing A* or Dijkstra's algorithm finding a shortest route through
real street graphs from OpenStreetMap.

Map data for Poznań, Warsaw, Paris, Berlin, London, New York, and Barcelona is
stored locally with the project, so the animation makes no external map request.

Map data © OpenStreetMap contributors, available under the ODbL.

Uses only Canvas API.
Coded by me (Marek Wydmuch) + Codex with GPT 5.5 in 2026.
`;

const Animation = require('../animation');
const Utils = require('../utils');

const MAP_FILES = {
    'Poznań': 'assets/map-data/shortest-path/poznan.json',
    'Warsaw': 'assets/map-data/shortest-path/warsaw.json',
    'Paris': 'assets/map-data/shortest-path/paris.json',
    'Berlin': 'assets/map-data/shortest-path/berlin.json',
    'London': 'assets/map-data/shortest-path/london.json',
    'New York': 'assets/map-data/shortest-path/new-york.json',
    'Barcelona': 'assets/map-data/shortest-path/barcelona.json',
};
const MAP_CACHE = new Map();
const ADMISSIBLE_HEURISTIC_SCALE = 0.7; // Edge lengths are rounded to whole meters.
const MARKER_MARGIN = 10;
const UNVISITED_EDGE_COLOR = '#808080';

const UNSEEN = 0,
      FRONTIER = 1,
      VISITED = 2,
      PATH = 3;

class MinHeap {
    constructor() {
        this.items = [];
    }

    get size() {
        return this.items.length;
    }

    clear() {
        this.items.length = 0;
    }

    push(item) {
        let index = this.items.length;
        this.items.push(item);
        while(index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if(this.items[parent].priority <= item.priority) break;
            this.items[index] = this.items[parent];
            index = parent;
        }
        this.items[index] = item;
    }

    pop() {
        if(this.items.length === 0) return null;
        const first = this.items[0],
              last = this.items.pop();
        if(this.items.length === 0) return first;

        let index = 0;
        while(true) {
            const left = index * 2 + 1,
                  right = left + 1;
            if(left >= this.items.length) break;
            let child = left;
            if(right < this.items.length && this.items[right].priority < this.items[left].priority) child = right;
            if(this.items[child].priority >= last.priority) break;
            this.items[index] = this.items[child];
            index = child;
        }
        this.items[index] = last;
        return first;
    }
}

class ShortestPathMap extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                city = 'random',
                searchAlgorithm = 'A*',
                speed = 128,
                autoRestart = true,
                showStats = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.cities = Object.keys(MAP_FILES);
        this.city = this.assignIfRandom(city, Utils.randomChoice(this.cities, this.rand));
        this.searchAlgorithms = ['A*', 'Dijkstra'];
        this.searchAlgorithm = this.assignIfRandom(searchAlgorithm, Utils.randomChoice(this.searchAlgorithms, this.rand));
        this.speed = speed;
        this.autoRestart = autoRestart;
        this.showStats = showStats;

        this.graph = null;
        this.adjacency = null;
        this.status = null;
        this.dist = null;
        this.prev = null;
        this.queue = new MinHeap();
        this.startIdx = 0;
        this.goalIdx = 0;
        this.visited = 0;
        this.pathLength = 0;
        this.searchRadius = 0;
        this.finished = false;
        this.finishedFrames = 0;
        this.loadingCity = null;
        this.loadError = null;
        this.loadRequest = 0;

        this.mapLayer = null;
        this.mapScale = 1;
        this.mapOffsetX = 0;
        this.mapOffsetY = 0;

        this.loadCity();
    }

    updateName() {
        this.name = `shortest path through ${this.city} using ${this.searchAlgorithm}`;
    }

    loadCity() {
        const city = this.city,
              request = ++this.loadRequest;
        this.graph = null;
        this.adjacency = null;
        this.mapLayer = null;
        this.loadingCity = city;
        this.loadError = null;
        this.updateName();

        if(MAP_CACHE.has(city)) {
            this.prepareGraph(MAP_CACHE.get(city));
            return;
        }

        fetch(MAP_FILES[city])
            .then(response => {
                if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
                return response.json();
            })
            .then(graph => {
                MAP_CACHE.set(city, graph);
                if(request === this.loadRequest && city === this.city) this.prepareGraph(graph);
            })
            .catch(error => {
                if(request === this.loadRequest) {
                    this.loadingCity = null;
                    this.loadError = `Could not load ${city}: ${error.message}`;
                }
            });
    }

    prepareGraph(graph) {
        this.graph = graph;
        this.adjacency = Array.from({length: this.graph.nodes.length}, () => []);
        for(const edge of this.graph.edges) {
            this.adjacency[edge[0]].push([edge[1], edge[2]]);
            this.adjacency[edge[1]].push([edge[0], edge[2]]);
        }
        this.layoutMap();
        this.setupRoute();
        this.loadingCity = null;
    }

    layoutMap() {
        if(!this.graph) return;
        const bounds = this.graph.boundsMeters,
              mapWidth = Math.max(1, bounds[2] - bounds[0]),
              mapHeight = Math.max(1, bounds[3] - bounds[1]);
        this.mapScale = Math.max(
            this.canvas.width / mapWidth,
            this.canvas.height / mapHeight
        );
        this.mapOffsetX = (this.canvas.width - mapWidth * this.mapScale) / 2 - bounds[0] * this.mapScale;
        this.mapOffsetY = (this.canvas.height - mapHeight * this.mapScale) / 2 - bounds[1] * this.mapScale;
    }

    isNodeVisible(nodeIdx) {
        if(!this.graph) return false;
        const node = this.graph.nodes[nodeIdx],
              x = node[0] * this.mapScale + this.mapOffsetX,
              y = node[1] * this.mapScale + this.mapOffsetY;
        return x >= MARKER_MARGIN && x <= this.canvas.width - MARKER_MARGIN &&
               y >= MARKER_MARGIN && y <= this.canvas.height - MARKER_MARGIN;
    }

    buildMapLayer() {
        if(!this.graph || typeof document === 'undefined') return;
        this.mapLayer = document.createElement('canvas');
        this.mapLayer.width = this.canvas.width;
        this.mapLayer.height = this.canvas.height;
        const ctx = this.mapLayer.getContext('2d');
        ctx.setTransform(this.mapScale, 0, 0, this.mapScale, this.mapOffsetX, this.mapOffsetY);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const roadWidths = [2.8, 2.6, 2.3, 2.0, 1.7, 1.25, 1.1, 1.1, 1.0, 0.75],
              roadAlphas = [0.68, 0.65, 0.60, 0.55, 0.50, 0.42, 0.38, 0.36, 0.34, 0.25];
        for(let type = roadWidths.length - 1; type >= 0; --type) {
            ctx.beginPath();
            for(const edge of this.graph.edges) {
                if(edge[3] !== type) continue;
                const from = this.graph.nodes[edge[0]],
                      to = this.graph.nodes[edge[1]];
                ctx.moveTo(from[0], from[1]);
                ctx.lineTo(to[0], to[1]);
            }
            ctx.globalAlpha = roadAlphas[type];
            ctx.strokeStyle = UNVISITED_EDGE_COLOR;
            ctx.lineWidth = roadWidths[type] / this.mapScale;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    heuristic(fromIdx, toIdx) {
        const from = this.graph.nodes[fromIdx],
              to = this.graph.nodes[toIdx];
        return Math.hypot(from[0] - to[0], from[1] - to[1]);
    }

    chooseRouteEndpoints() {
        const visibleNodes = [];
        for(let node = 0; node < this.graph.nodes.length; ++node) {
            if(this.isNodeVisible(node)) visibleNodes.push(node);
        }
        if(visibleNodes.length === 0) {
            this.startIdx = 0;
            this.goalIdx = 0;
            return;
        }

        this.startIdx = Utils.randomChoice(visibleNodes, this.rand);
        this.goalIdx = Utils.randomChoice(visibleNodes, this.rand);
    }

    setupRoute() {
        if(!this.graph) return;
        this.chooseRouteEndpoints();
        this.buildMapLayer();
        this.resetSearch();
    }

    resetSearch() {
        if(!this.graph) return;
        this.status = new Uint8Array(this.graph.nodes.length);
        this.dist = new Float64Array(this.graph.nodes.length);
        this.dist.fill(Infinity);
        this.prev = new Int32Array(this.graph.nodes.length);
        this.prev.fill(-1);
        this.queue.clear();

        this.dist[this.startIdx] = 0;
        this.status[this.startIdx] = FRONTIER;
        this.queue.push({node: this.startIdx, distance: 0, priority: 0});
        this.visited = 0;
        this.pathLength = 0;
        this.searchRadius = 0;
        this.finished = false;
        this.finishedFrames = 0;
        this.frame = 0;
        this.updateName();
    }

    finishSearch() {
        this.finished = true;
        this.pathLength = this.dist[this.goalIdx];
        let node = this.goalIdx;
        while(node >= 0) {
            this.status[node] = PATH;
            node = this.prev[node];
        }
        this.queue.clear();
    }

    expandNextNode() {
        let item = this.queue.pop();
        while(item && (this.status[item.node] === VISITED || item.distance !== this.dist[item.node])) item = this.queue.pop();
        if(!item) {
            this.finished = true;
            return;
        }

        const node = item.node;
        if(node === this.goalIdx) {
            this.finishSearch();
            return;
        }

        this.status[node] = VISITED;
        this.searchRadius = Math.max(this.searchRadius, this.dist[node]);
        ++this.visited;
        for(const connection of this.adjacency[node]) {
            const next = connection[0],
                  newDistance = this.dist[node] + connection[1];
            if(this.status[next] !== VISITED && newDistance < this.dist[next]) {
                this.dist[next] = newDistance;
                this.prev[next] = node;
                this.status[next] = FRONTIER;
                const estimate = this.searchAlgorithm === 'A*' ? ADMISSIBLE_HEURISTIC_SCALE * this.heuristic(next, this.goalIdx) : 0;
                this.queue.push({node: next, distance: newDistance, priority: newDistance + estimate});
            }
        }
    }

    update(elapsedMs) {
        const elapsed = elapsedMs / 1000;
        this.realTimeMs += elapsedMs;
        this.realTime += elapsed;
        this.timeMs += elapsedMs;
        this.time += elapsed;
        ++this.frame;

        if(!this.graph) return;

        if(!this.finished) {
            for(let i = 0; i < this.speed && !this.finished; ++i) this.expandNextNode();
        } else if(this.autoRestart && ++this.finishedFrames >= 150) {
            this.setupRoute();
        }
    }

    drawSearchTree(state, color, width, alpha) {
        this.ctx.beginPath();
        for(let node = 0; node < this.status.length; ++node) {
            if(this.status[node] !== state || this.prev[node] < 0) continue;
            const from = this.graph.nodes[node],
                  to = this.graph.nodes[this.prev[node]];
            this.ctx.moveTo(from[0], from[1]);
            this.ctx.lineTo(to[0], to[1]);
        }
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width / this.mapScale;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    drawMarker(nodeIdx, color, radius) {
        const node = this.graph.nodes[nodeIdx];
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(node[0], node[1], radius / this.mapScale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = this.bgColor;
        this.ctx.lineWidth = 2 / this.mapScale;
        this.ctx.stroke();
    }

    draw() {
        this.clear();
        if(!this.graph) {
            this.resetFont();
            this.ctx.fillStyle = this.colors[0];
            this.ctx.strokeStyle = this.bgColor;
            const message = this.loadError || `Loading ${this.loadingCity || this.city} street map…`;
            this.drawTextLines([message], this.lineHeight, this.lineHeight / 2, true);
            return;
        }
        if(this.mapLayer) this.ctx.drawImage(this.mapLayer, 0, 0);

        this.ctx.save();
        this.ctx.setTransform(this.mapScale, 0, 0, this.mapScale, this.mapOffsetX, this.mapOffsetY);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.drawSearchTree(FRONTIER, this.colors[2], 1.1, 0.45);
        this.drawSearchTree(VISITED, this.colors[0], 1.35, 0.68);
        this.drawSearchTree(PATH, this.colorsAlt[2], 3.5, 1);
        this.drawMarker(this.startIdx, this.colorsAlt[0], 5);
        this.drawMarker(this.goalIdx, this.colorsAlt[1], 5);
        this.ctx.restore();

        if(this.showStats) {
            this.resetFont();
            const distanceLabel = this.finished ? 'Shortest path length' : 'Longest traveled path';
            const distance = this.finished ? this.pathLength : this.searchRadius;
            const statsLines = [
                `City: ${this.city}`,
                `Search algorithm: ${this.searchAlgorithm}`,
                `Visited nodes: ${this.visited}`,
                `Frontier nodes: ${this.queue.size}`,
                `${distanceLabel}: ${distance >= 1000 ? `${Utils.round(distance / 1000, 2)} km` : `${Math.round(distance)} m`}`,
            ];
            this.drawTextLines(statsLines, this.lineHeight, this.canvas.height - (statsLines.length + 1) * this.lineHeight);
        }

        const attribution = '© OpenStreetMap contributors · ODbL';
        this.ctx.font = '11px sans-serif';
        const attributionWidth = this.ctx.measureText(attribution).width;
        this.ctx.fillStyle = this.colors[0];
        this.ctx.strokeStyle = this.bgColor;
        Utils.fillAndStrokeText(this.ctx, attribution, this.canvas.width - attributionWidth - 8, this.canvas.height - 8);
    }

    resize() {
        if(!this.graph) return;
        this.layoutMap();
        this.setupRoute();
    }

    restart() {
        this.realTimeMs = 0;
        this.realTime = 0;
        this.timeMs = 0;
        this.time = 0;
        this.setSeed(this.seed);
        if(!this.graph || this.graph.city !== this.city) {
            if(this.loadingCity !== this.city) this.loadCity();
            return;
        }
        this.setupRoute();
        this.clear();
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.buildMapLayer();
    }

    getSettings() {
        return [
            {prop: 'city', type: 'select', values: this.cities, toCall: 'loadCity'},
            {prop: 'searchAlgorithm', type: 'select', values: this.searchAlgorithms, toCall: 'resetSearch'},
            {prop: 'speed', icon: '<i class="fa-solid fa-gauge-high"></i>', type: 'int', min: 1, max: 1024},
            {prop: 'autoRestart', icon: '<i class="fa-solid fa-clock-rotate-left"></i>', type: 'bool'},
            {prop: 'showStats', icon: '<i class="fa-solid fa-circle-info"></i>', type: 'bool'},
            this.getSeedSettings('restart'),
        ];
    }
}

module.exports = ShortestPathMap;
