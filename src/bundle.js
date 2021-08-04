(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

const Animation = require("./animation");

class ThreeNPlusOne extends Animation {
    constructor (canvas, colors, length = 30, evenAngel = 8, oddAngel = -20) {
        super(canvas, colors);
        this.length = length;
        this.evenAngel = evenAngel * Math.PI / 180;
        this.oddAngel = oddAngel * Math.PI / 180;
        this.seqences = []
        this.frame = 0;
        this.startX;
        this.startY;
        this.resize();
    }

    getName(){
        return "3n + 1 visualization"
    }

    update(elapsed){
        let n = this.seqences.length + 1;
        let sequence = [n];
        while(n != 1){
            if(n % 2) n = 3 * n + 1;
            else n /= 2;
            sequence.push(n);
        }
        this.seqences.push(sequence);
    }

    drawSequence(sequence) {
        let x = this.startX;
        let y = this.startY;
        let angle = 270 * Math.PI / 180;

        this.ctx.strokeStyle = this.colors[this.frame % this.colors.length];
        this.ctx.lineWidth = 2;

        for(let i = sequence.length - 2; i >= 0; --i){
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);

            if(sequence[i] % 2) angle += this.oddAngel;
            else angle += this.evenAngel;

            x += this.length * Math.cos(angle);
            y += this.length * Math.sin(angle);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }

    draw() {
        while(this.frame < this.seqences.length){
            this.drawSequence(this.seqences[this.frame]);
            ++this.frame;
        }
    }

    resize() {
        this.startX = this.ctx.canvas.width / 2;
        this.startY = this.ctx.canvas.height;

        this.frame = 0;
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

module.exports = ThreeNPlusOne;

},{"./animation":2}],2:[function(require,module,exports){
'use strict';

class Animation {
    constructor(canvas, colors) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.colors = colors;
    }

    getFPS(){
        return 25;
    }

    getName(){
        return "unamed animation";
    }
}

module.exports = Animation;

},{}],3:[function(require,module,exports){
'use strict';

const Animation = require("./animation");

class GameOfLife extends Animation {
    constructor (canvas, colors, cellSize = 10) {
        super(canvas, colors);
        this.cellSize = cellSize;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = null;
        this.gridNextState = null;
        this.resize();
    }

    getName(){
        return "Conway's Game of Life"
    }

    getCord(x, y) {
        return x + y * this.gridWidth;
    }

    isAlive(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return false;
        else return (this.grid[this.getCord(x, y)] == 1) ? 1 : 0;
    }

    update(elapsed){
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let numAlive = this.isAlive(x - 1, y - 1)
                    + this.isAlive(x, y - 1)
                    + this.isAlive(x + 1, y - 1)
                    + this.isAlive(x - 1, y)
                    + this.isAlive(x + 1, y)
                    + this.isAlive(x - 1, y + 1)
                    + this.isAlive(x, y + 1)
                    + this.isAlive(x + 1, y + 1);
                let cellCord = this.getCord(x, y);
                if (numAlive == 2 && this.grid[cellCord] == 1) this.gridNextState[cellCord] = this.grid[cellCord];
                else if (numAlive == 3) this.gridNextState[cellCord] = 1;
                else this.gridNextState[cellCord] = this.grid[cellCord] - 1;
            }
        }

        [this.grid, this.gridNextState] = [this.gridNextState, this.grid];
    }

    draw() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let cellVal = this.grid[this.getCord(x, y)];
                //let cellPadding = 1 - Math.min(0, cellVal);
                let cellPadding = 1
                let fillStyle = null;
                if(cellVal >= 0 ) fillStyle = this.colors[0];
                else if(cellVal >= -2){
                    fillStyle = this.colors[1];
                    cellPadding += 1
                }
                else if(cellVal >= -4){
                    fillStyle = this.colors[2];
                    cellPadding += 2
                }
                else if(cellVal >= -16){
                    fillStyle = this.colors[3];
                    cellPadding += 3
                }
                if(fillStyle) {
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.fillRect(x * this.cellSize + cellPadding,
                        y * this.cellSize + cellPadding,
                        this.cellSize - 2 * cellPadding,
                        this.cellSize - 2 * cellPadding);
                }
            }
        }
    }

    resize() {
        let newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize);
        let newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; y++) {
            for (let x = 0; x < newGridWidth; x++) {
                let cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getCord(x, y)];
                else newGrid[cellCord] = (Math.random() > 0.5) ? 1 : 0;
            }
        }

        this.grid = newGrid;
        this.gridNextState = [...this.grid];
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }
}

module.exports = GameOfLife;

},{"./animation":2}],4:[function(require,module,exports){
'use strict';

// Require
// ---------------------------------------------------------------------------------------------------------------------

const GameOfLife = require("./game-of-live");
const PerlinNoiseParticles = require("./perlin-noise-particles");
const SpinningShapes = require("./spinning-shapes");
const NeuralNetwork = require("./neural-network");
const ThreeNPlusOne = require("./3n+1");


// Globals
// ---------------------------------------------------------------------------------------------------------------------

const canvas = document.getElementById("background");
const container = document.getElementById("container");
var lastWidth = 0;
var lastHeight = 0;
var needResize = false;

const colors = [ // Green
    "#54ABA4",
    "#639598",
    "#678786",
    "#92ABA1",
    "#A5BFBC",
//    "#C5D1D2",
//    "#CCEDAE"
]

// const colors = [ // Grey
//     "#777777",
//     "#888888",
//     "#999999",
//     "#AAAAAA"
// ]


// Create animation and init animation loop
// ---------------------------------------------------------------------------------------------------------------------

const animations = [
    GameOfLife,
    PerlinNoiseParticles,
    SpinningShapes,
    NeuralNetwork,
    ThreeNPlusOne
]

const animation = new animations[Math.floor(Math.random() * animations.length)](canvas, colors);

// Due to performance concerns, run all the animations at max 25 frames per second
var fps = animation.getFPS();
var fpsInterval = 1000 / fps;
var then = Date.now();


const content = document.getElementById("content");
const backgroundName = document.getElementById("background-name");
backgroundName.innerHTML += animation.getName();
backgroundName.addEventListener("mouseover", function(){
    content.classList.remove("show-from-0");
    content.classList.add("fade-to-0");
    canvas.classList.remove("faded-8");
    canvas.classList.remove("fade-to-8");
    canvas.classList.add("hue-change");
    canvas.classList.add("show-from-8");
});
backgroundName.addEventListener("mouseout", function(){
    content.classList.remove("fade-to-0");
    content.classList.add("show-from-0");
    canvas.classList.remove("show-from-8");
    canvas.classList.add("fade-to-8");
    canvas.classList.remove("hue-change");
});

// Start animation
function render() {
    requestAnimationFrame(render);

    // Limit framerate
    let now = Date.now();
    let elapsed = now - then;
    if (elapsed < fpsInterval) return;
    then = now;

    // Detect container size change
    let width  = Math.max(container.offsetWidth, window.innerWidth);
    let height = Math.max(container.offsetHeight, window.innerHeight);
    if(width != lastWidth || height != lastHeight) needResize = true;
    else if (needResize){
        canvas.width = width;
        canvas.height = height;
        animation.resize();
        needResize = false;
    }
    lastHeight = height;
    lastWidth = width;

    animation.update(elapsed);
    animation.draw();
}

render();

},{"./3n+1":1,"./game-of-live":3,"./neural-network":5,"./perlin-noise-particles":6,"./spinning-shapes":8}],5:[function(require,module,exports){
'use strict';

const Animation = require("./animation");
const Utils = require("./utils");

class NeuralNetwork extends Animation {
    constructor(canvas, colors) {
        super(canvas, colors);
        this.network = [];
        this.nLayers = 0;
        this.resize();

        this.baseNodeSize = 3;
        this.baseLineSize = 1;
    }

    getFPS(){
        return 2;
    }

    getName(){
        return "visualization of simple neural network"
    }

    update(elapsed){
        // Update network values

        // Randomly
        // for (let l of this.network) {
        //     for (let n of l) n.v = Math.random();
        // }

        // Calculate values based on weights
        if(this.network.length == 0) return;
        for (let n of this.network[0]) n.v = Utils.randomRange(-1, 1);
        for (let i = 1; i < this.nLayers; i++) {
            for (let n of this.network[i]) {
                n.v = 0;
                for (let j = 0; j < this.network[i - 1].length; ++j) {
                    n.v += this.network[i - 1][j].v * n.w[j];
                }
                if(i == this.nLayers - 1) n.v = 1 / (1 + Math.exp(-n.v)); // Sigmoid for last layer
                else n.v = Math.max(0, n.v); // ReLU
            }
        }
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        if (this.stateData != null) {
            this.ctx.globalAlpha = 1 - this.time / this.stateTime;
            if (this.prevStateData != null) this.ctx.putImageData(this.prevStateData, 0, 0);
            this.ctx.globalAlpha = this.time / this.stateTime;
            this.ctx.putImageData(this.stateData, 0, 0);
            return
        }

        // Draw connections
        for (let i = 0; i < this.nLayers - 1; i++) {
            let l1 = this.network[i];
            let l2 = this.network[i + 1];
            for (let n1 of l1) {
                for (let n2 of l2) {
                    let v = Utils.clip(n1.v, 0, 1);
                    let color = this.colors[this.colors.length - 1 - Math.floor(v * this.colors.length)];
                    this.ctx.globalAlpha = v;
                    this.ctx.lineWidth = 1 + v;
                    this.ctx.strokeStyle = color;
                    this.ctx.beginPath();
                    this.ctx.moveTo(n1.x, n1.y);
                    this.ctx.lineTo(n2.x, n2.y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw nodes
        this.ctx.globalAlpha = 1.0;
        for (let l of this.network) {
            for (let n of l) {
                let v = Utils.clip(n.v, 0, 1);
                let v2 = Utils.clip(n.v * 2, 0, 4);
                let color = this.colors[this.colors.length - 1 - Math.floor(v * this.colors.length)];
                let nSize = this.baseNodeSize + v2;
                Utils.fillCircle(this.ctx, color, n.x, n.y, nSize);
                this.ctx.font = '12px sans-serif';
                this.ctx.fillText(n.v.toFixed(2), n.x - 11, n.y - 2 * this.baseNodeSize);
            }
        }
    }


    resize() {
        Utils.clear(this.ctx, "#FFFFFF");

        // Create new network that will nicely fit to the entire page
        this.network = [];
        this.nLayers = 5;
        let x = 150;
        let width = this.ctx.canvas.width;
        let height = this.ctx.canvas.height;
        let interLayer = width / this.nLayers;
        let interNode = height / 17;
        for (let i = 0; i < this.nLayers; i++) {
            let layer = [];
            let layerNodes = 0;
            if(i == 0 || i == this.nLayers - 1) layerNodes = Math.floor(Utils.randomRange(4, 16));
            else layerNodes = Utils.randomChoice([8, 12, 16]);
            let y = height / 2 - Math.floor(layerNodes / 2) * interNode;
            if (layerNodes % 2 == 0) {
                y += interNode/2;
            }

            for (let j = 0; j < layerNodes; j++) {
                let n = {x: x, y: y, v: 0, w: null};
                if(i > 0) n.w = Utils.randomArray(this.network[i - 1].length, -1, 1);
                layer.push(n);
                y += interNode;
            }
            this.network.push(layer);
            x += interLayer;
        }
    }
}

module.exports = NeuralNetwork;

},{"./animation":2,"./utils":9}],6:[function(require,module,exports){
'use strict';

const Animation = require("./animation");
const PerlinNoise = require("./perlin-noise");
const Utils = require("./utils");

class PerlinNoiseParticles extends Animation {
    constructor(canvas, colors, particlePer100PixSq = 4, noiseScale = 1200) {
        super(canvas, colors);
        this.particlePer100PixSq = particlePer100PixSq;
        this.noiseScale = noiseScale;
        this.noise = new PerlinNoise();
        this.width = 0;
        this.height = 0;
        this.particles = [];
        this.imageData = null;
        this.resize();
    }

    getFPS(){
        return 25;
    }

    getName(){
        return "particles moving through Perlin noise"
    }

    update(elapsed) {
        for(let p of this.particles){
            let angle = this.noise.get(p.x / this.noiseScale, p.y / this.noiseScale) * 2 * Math.PI * this.noiseScale;
            p.x += Math.cos(angle) * p.speed;
            p.y += Math.sin(angle) * p.speed;
        }
    }

    draw() {
        for(let p of this.particles) Utils.fillCircle(this.ctx, p.color, p.x, p.y, p.radius);
        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    spawnParticles(x, y, width, height) {
        let newParticles = width / 100 * height / 100 * this.particlePer100PixSq;

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            this.particles.push({
                x: Math.random() * width + x,
                y: Math.random() * height + y,
                speed: Math.random() * 0.15 + 0.10,
                radius: Math.random() * 0.5 + 0.5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)]
            });
        }
    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");
        if(this.imageData != null) this.ctx.putImageData(this.imageData, 0, 0);

        // Add particles to new parts of the image
        let divWidth = this.ctx.canvas.width - this.width;
        let divHeight = this.ctx.canvas.height - this.height;

        if(divWidth > 0) this.spawnParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spawnParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spawnParticles(this.width, this.height, divWidth, divHeight);

        this.width = Math.max(this.ctx.canvas.width, this.width);
        this.height = Math.max(this.ctx.canvas.height, this.height);

        // Visualize Perlin noise
        // const gridWidth = this.ctx.canvas.width / this.moveScale;
        // const gridHeight = this.ctx.canvas.height / this.moveScale;
        // const pixelSize = 20;
        // const numPixels = gridWidth / this.ctx.canvas.width * pixelSize;
        // for (let y = 0; y < gridHeight; y += numPixels){
        //     for (let x = 0; x < gridWidth; x += numPixels){
        //         let v = parseInt(this.noise.get(x, y) * 250);
        //         this.ctx.fillStyle = 'hsl(' + v + ',50%,50%)';
        //         this.ctx.fillRect(x / gridWidth * this.ctx.canvas.width, y / gridHeight * this.ctx.canvas.height, pixelSize, pixelSize);
        //     }
        // }
    }
}

module.exports = PerlinNoiseParticles;

},{"./animation":2,"./perlin-noise":7,"./utils":9}],7:[function(require,module,exports){
'use strict';

// Based on: https://github.com/joeiddon/perlin
class PerlinNoise {
    constructor() {
        // It uses "memory" of gradients and values already calculated for Perlin noise
        this.noiseGradients = {};
        this.noiseMemory = {};
    }

    dotNoiseGrid(x, y, vx, vy){
        let dVec = {x: x - vx, y: y - vy};
        let gVec;
        if (this.noiseGradients[[vx, vy]]){
            gVec = this.noiseGradients[[vx, vy]];
        } else {
            let theta = Math.random() * 2 * Math.PI;
            gVec = {x: Math.cos(theta), y: Math.sin(theta)};
            this.noiseGradients[[vx, vy]] = gVec;
        }
        return dVec.x * gVec.x + dVec.y * gVec.y;
    }

    interpolate(x, a, b){
        //return a + x * (b - a);
        return a + (6 * x**5 - 15 * x**4 + 10 * x**3) * (b - a);
    }

    get(x, y) {
        // Get from memory if already calculated
        if (this.noiseMemory.hasOwnProperty([x, y]))
            return this.noiseMemory[[x, y]];

        let xf = Math.floor(x);
        let yf = Math.floor(y);

        // Interpolate
        let tl = this.dotNoiseGrid(x, y, xf, yf);
        let tr = this.dotNoiseGrid(x, y, xf + 1, yf);
        let bl = this.dotNoiseGrid(x, y, xf, yf + 1);
        let br = this.dotNoiseGrid(x, y, xf + 1, yf + 1);
        let xt = this.interpolate(x - xf, tl, tr);
        let xb = this.interpolate(x - xf, bl, br);
        let v = this.interpolate(y - yf, xt, xb);

        this.noiseMemory[[x, y]] = v;
        return v;
    }
}

module.exports = PerlinNoise;

},{}],8:[function(require,module,exports){
'use strict';

const Animation = require("./animation");

// Based on: https://observablehq.com/@rreusser/instanced-webgl-circles
class SpinningShapes extends Animation {
    constructor (canvas, colors, shapes = 500) {
        super(canvas, colors);
        this.shapes = shapes;
        this.time = 0;
        this.scale = 0;
        this.centerX = 0;
        this.centerY = 0;

        this.dist_base = 0.6;
        this.dist_var = 0.2;
        this.size_base = 0.2;
        this.size_var = 0.12;

        this.resize();
    }

    getName(){
        return "circles moving in a circle"
    }

    update(elapsed){
        this.time += elapsed / 1000;
    }

    getCenterForTheta(theta, time, scale) {
        let distance = (this.dist_base + this.dist_var * Math.cos(theta * 6 + Math.cos(theta * 8 + time / 2))) * scale;
        return {x: Math.cos(theta) * distance, y: Math.sin(theta) * distance}
    }

    getSizeForTheta(theta, time, scale) {
        return (this.size_base + this.size_var * Math.cos(theta * 9 - time)) * scale;
    }

    getColorForTheta(theta, time) {
        return this.colors[Math.floor((Math.cos(theta * 9 - time) + 1) / 2 * this.colors.length)];
    }

    draw() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (let i = 0; i < this.shapes; ++i) {
            let shapeTheta = i / this.shapes * 2 * Math.PI;
            let shapeCenter = this.getCenterForTheta(shapeTheta, this.time, this.scale);
            let shapeSize = this.getSizeForTheta(shapeTheta, this.time, this.scale);
            this.ctx.strokeStyle = this.getColorForTheta(shapeTheta, this.time);
            this.ctx.lineWidth = 1;

            // TODO: draw other types of polygons instead of circles
            this.ctx.beginPath();
            this.ctx.arc(shapeCenter.x + this.centerX, shapeCenter.y + this.centerY, shapeSize, 0, 2 * Math.PI, false);
            this.ctx.stroke();
        }
    }

    resize() {
        this.centerX = this.ctx.canvas.width / 2;
        this.centerY = this.ctx.canvas.height / 2;
        this.scale = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3;
    }
}

module.exports = SpinningShapes

},{"./animation":2}],9:[function(require,module,exports){
module.exports = {

    randomRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomChoice: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    randomBoxMuller: function() {
        return Math.sqrt(-2.0 * Math.log( 1 - Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
    },

    randomArray: function(length, min, max){
        return Array(length).fill().map(() => this.randomRange(min, max))
    },

    clip: function(value, min, max){
        return Math.max(min, Math.min(max, value));
    },

    // Function to linearly interpolate between v1 and v2
    lerp: function(v1, v2, t) {
        return (1.0 - t) * v1 + t * v2;
    },

    clear(ctx, color){
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    },

    fillRect(ctx, color, x, y, w, h){

    },

    fillCircle(ctx, color, x, y, radius){
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
    },

    strokeCircle(ctx, color, x, y, radius){
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.stroke();
    },
};

},{}]},{},[4])