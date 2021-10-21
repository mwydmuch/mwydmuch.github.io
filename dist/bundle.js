(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * 3n + 1 (Collatz Conjecture) visualization.
 * Inspired by Veritasium video: https://www.youtube.com/watch?v=094y1Z2wpJg
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");

class ThreeNPlusOne extends Animation {
    constructor (canvas, colors, colorsAlt,
                 length = 30,
                 evenAngle = 8,
                 oddAngle = -20
    ) {
        super(canvas, colors, colorsAlt, "3n + 1 (Collatz Conjecture) visualization", "3n+1.js");
        this.length = length;
        this.evenAngle = evenAngle * Math.PI / 180;
        this.oddAngle = oddAngle * Math.PI / 180;
        this.seqences = []
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
        let x = this.ctx.canvas.width / 2;
        let y = this.ctx.canvas.height;
        let angle = 270 * Math.PI / 180;

        this.ctx.strokeStyle = this.colors[this.frame % this.colors.length];
        this.ctx.lineWidth = 2;

        for(let i = sequence.length - 2; i >= 0; --i){
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);

            if(sequence[i] % 2) angle += this.oddAngle;
            else angle += this.evenAngle;

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
        this.frame = 0;
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

module.exports = ThreeNPlusOne;

},{"./animation":2}],2:[function(require,module,exports){
/*
 * Base class for all the background animations.
 */

class Animation {
    constructor(canvas, colors, colorsAlt, name, file) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.colors = colors;
        this.colorsAlt = colorsAlt;
        this.name = name;
        this.file = file;
        this.time = 0;
        this.frame = 0;
    }

    getFPS(){
        return 25;
    }

    getName(){
        return this.name;
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/src/" + this.file;
    }

    update(elapsed){
        this.time += elapsed / 1000;
        ++this.frame;
    }

    resize(){

    }
}

module.exports = Animation;

},{}],3:[function(require,module,exports){
/*
 * Shapes
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class CircularWaves extends Animation {
    constructor(canvas, colors, colorsAlt,
                degPerVertex = 2,
                noiseScale = 0.5,
                noiseMin = 0.4,
                noiseMax = 1.2,
                fadeOut = true
    ) {
        super(canvas, colors, colorsAlt, "circular waves", "circular-waves.js");
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.degPerVertex = degPerVertex;
        this.noiseScale = noiseScale;
        this.noiseMin = noiseMin;
        this.noiseMax = noiseMax;
        this.fadeOut = fadeOut;

        this.color1 = this.colors[0];
        this.color2 = this.colorsAlt[0];

        this.radiusMin = 0;
        this.radiusMax = 0;
    }

    draw() {
        if(this.fadeOut && this.frame % 10 == 0) Utils.blendColor(this.ctx, "#FFFFFF", 0.01, "lighter");

        const zoff = this.frame * 0.005;
        this.ctx.strokeStyle = Utils.lerpColor(this.color1, this.color2, Math.abs(Math.sin(zoff * 5)));

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        this.ctx.beginPath();
        for (let a = 0; a <= 360; a += this.degPerVertex) {
            const aRad = a * Math.PI / 180,
                  xoff = Math.cos(aRad) * this.noiseScale,
                  yoff = Math.sin(aRad) * this.noiseScale,

                  n = this.noise.simplex3(xoff, yoff, zoff),
                  r = Utils.remap(n, -1, 1, this.radiusMin, this.radiusMax),
                  x = r * Math.cos(aRad),
                  y = r * Math.sin(aRad);

            if(a == 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        this.ctx.resetTransform();
    }

    resize() {
        this.radiusMin = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.noiseMin;
        this.radiusMax = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.noiseMax;
        Utils.clear(this.ctx, "#FFFFFF");
    }
}

module.exports = CircularWaves;

},{"./animation":2,"./noise":8,"./utils":13}],4:[function(require,module,exports){
/*
 * Conway's Game of Life visualization.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");

class GameOfLife extends Animation {
    constructor (canvas, colors, colorsAlt, cellSize = 10) {
        super(canvas, colors, colorsAlt, "Conway's Game of Life", "game-of-live.js");
        this.cellSize = cellSize;

        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = null;
        this.gridNextState = null;
    }

    getIdx(x, y) {
        return x + y * this.gridWidth;
    }

    getVal(x, y) {
        return this.grid[this.getIdx(x, y)];
    }

    isAlive(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return 0;
        else return (this.getVal(x, y) == 1) ? 1 : 0;
    }

    update(elapsed){
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                const numAlive = this.isAlive(x - 1, y - 1)
                      + this.isAlive(x, y - 1)
                      + this.isAlive(x + 1, y - 1)
                      + this.isAlive(x - 1, y)
                      + this.isAlive(x + 1, y)
                      + this.isAlive(x - 1, y + 1)
                      + this.isAlive(x, y + 1)
                      + this.isAlive(x + 1, y + 1);
                const cellIdx = this.getIdx(x, y);
                if (numAlive == 2 && this.grid[cellIdx] == 1) this.gridNextState[cellIdx] = this.grid[cellIdx];
                else if (numAlive == 3) this.gridNextState[cellIdx] = 1;
                else this.gridNextState[cellIdx] = this.grid[cellIdx] - 1;
            }
        }

        [this.grid, this.gridNextState] = [this.gridNextState, this.grid];
    }

    draw() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let cellVal = this.getVal(x, y);
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
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; y++) {
            for (let x = 0; x < newGridWidth; x++) {
                let cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(x, y)];
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

},{"./animation":2}],5:[function(require,module,exports){
/*
 * Visualization of
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");


class Optim {
    constructor(w, name) {
        this.w = [...w];
        this.name = name;
    }

    update(grad){
        return 0;
    }

    getW(){
        return this.w;
    }

    getName(){
        return this.name;
    }
}

class SGD extends Optim {
    constructor (w) {
        super(w , "SGD");
        this.eta = 0.001;
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.w[i] -= this.eta * grad[i];
        }
    }
}

class Momentum extends Optim {
    constructor (w) {
        super(w, "Momentum");
        this.eta = 0.01;
        this.beta = 0.9;
        this.m = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta * this.m[i] + (1 - this.beta) * grad[i];
            this.w[i] -= this.eta * this.m[i];
        }
    }
}

class AdaGrad extends Optim {
    constructor (w) {
        super(w, "AdaGrad");
        this.eta = 0.1;
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.v[i] += grad[i] * grad[i];
            this.w[i] -= this.eta / Math.sqrt(this.v[i] + 0.000001) * grad[i];
        }
    }
}

class RMSProp extends Optim {
    constructor (w) {
        super(w, "RMSProp");
        this.eta = 0.01;
        this.beta = 0.9;
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.v[i] = this.beta * this.v[i] + (1 - this.beta) * grad[i] * grad[i];
            this.w[i] -= this.eta / Math.sqrt(this.v[i] + 0.000001) * grad[i];
        }
    }
}

class Adam extends Optim {
    constructor (w) {
        super(w, "Adam");
        this.eta = 0.01;
        this.beta1 = 0.9;
        this.beta2 = 0.999;
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * grad[i] * grad[i];
            this.w[i] -= this.eta / (Math.sqrt(this.v[i] / (1 - this.beta2)) + 0.000001) * this.m[i] / (1 - this.beta1);
        }
    }
}

class Nadam extends Optim {
    constructor (w) {
        super(w, "Nadam");
        this.eta = 0.001;
        this.beta1 = 0.9;
        this.beta2 = 0.999;
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * grad[i] * grad[i];
            this.w[i] -= this.eta / (Math.sqrt(this.v[i] / (1 - this.beta2)) + 0.000001) * this.m[i] / (1 - this.beta1);
        }
    }
}


class Func {
    constructor(name, globalMin, startPoint, range) {
        this.name = name;
        this.globalMin = globalMin;
        this.startPoint = startPoint;
        this.range = range;
    }

    hasGlobalMin(){
        return this.globalMin != null;
    }

    getGlobalMin(){
        return this.globalMin;
    }

    getRange(){
        return this.range;
    }

    getStartPoint(){
        return this.startPoint;
    }

    getName(){
        return this.name;
    }
}


class SaddlePointFunc extends Func {
    constructor() {
        super("f(x, y) = x^2 - y^2", null, [-1, 0.001], [-1, 1]);
    }

    val(w) {
        const x = w[0], y = w[1];
        return x * x - y * y;
    }

    grad(w){
        const x = w[0], y = w[1];
        return [
            2 * x,
            -2 * y
        ]
    }
}

class BEALEFunc extends Func{
    constructor() {
        super("Beale function", [3, 0.5], [-1, 1], [-3, 3]);
    }

    val(w) {
        const x = w[0], y = w[1];
        return Math.pow(1.5 - x + x * y, 2) + Math.pow(2.25 - x + x * y * y, 2) + Math.pow(2.625 - x + x * Math.pow(y, 3), 2);
    }

    grad(w){
        const x = w[0], y = w[1],
              y2 = y * y,
              y3 = Math.pow(y, 3),
              y4 = Math.pow(y, 4),
              y5 = Math.pow(y, 5),
              y6 = Math.pow(y, 6);
        return [
            2 * x * (y6 + y4 - 2 * y3 - y2 - 2 * y + 3) + 5.25 * y3 + 4.5 * y2 + 3 * y - 12.75,
            6 * x * (x * (y5 + 2/3 * y3 - y2 - 1/3 * y - 1/3) + 2.625 * y2 + 1.5 * y + 0.5)
        ]
    }
}


class GradientDescent extends Animation {
    constructor (canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "gradient descent", "gradient-descent.js");
        this.func = new BEALEFunc();
        //this.func = new SaddlePointFunc();

        this.scale = 0;
        this.optims = null;
        this.imageData = null;
    }

    draw() {
        //if(this.imageData != null) this.ctx.putImageData(this.imageData, 0, 0);

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        for (let i = 0; i < this.optims.length; ++i) {
            let x1, y1, x2, y2;
            let o = this.optims[i];
            [x1, y1] = o.getW();
            o.update(this.func.grad(o.getW()));
            [x2, y2] = o.getW();
            Utils.drawLine(this.ctx, x1 * this.scale, -y1 * this.scale, x2 * this.scale, -y2 * this.scale, this.colorsAlt[i], 2);
        }

        this.ctx.resetTransform();

        //this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        //
        // for (let i = 0; i < this.optims.length; ++i) {
        //     let x1, y1;
        //     let o = this.optims[i];
        //     [x1, y1] = o.getW();
        //
        //     this.ctx.fillStyle = this.colorsAlt[i];
        //     this.ctx.font = '12px sans-serif';
        //     let v = this.func.val([x1, y1]);
        //     this.ctx.fillText(o.constructor.name + ": " + v.toFixed(2), x1 * this.scale, -y1 * this.scale);
        // }
        //
        // this.ctx.resetTransform();

    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");
        this.imageData = null;

        const width = this.ctx.canvas.width,
              height = this.ctx.canvas.height,
              centerX = width / 2,
              centerY = height / 2,
              range = this.func.getRange();
        this.scale = Math.min(width, height) / (range[1] - range[0]);

        // Add function name and text
        this.ctx.fillStyle = this.colors[0];
        this.ctx.font = '12px sans-serif';

        this.ctx.fillText(this.func.getName(), 40, 22)
        if(this.func.hasGlobalMin()) {
            const globalMin = this.func.getGlobalMin()
            this.ctx.fillText("f(x*) = " + this.func.val(globalMin) + ", at x* =  (" + globalMin[0] + ", " + globalMin[1] + ")", 40, 42);
            Utils.fillCircle(this.ctx, this.colors[0], centerX + globalMin[0] * this.scale, centerY + -globalMin[1] * this.scale, 2);
        }

        // Very simple approach to draw isolines
        let isobands = new Array(width * height);
        let isolines = [0, 0.125];
        let exp = 2;
        let plusVal = 0;

        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const x = (i - centerX) / this.scale, y = -(j - centerY) / this.scale,
                      val = this.func.val([x, y]),
                      idx = i + j * width;

                while(val > isolines[isolines.length - 1]) isolines.push(isolines[isolines.length - 1] * exp + plusVal);
                for(let k = 1; k < isolines.length; ++k) {
                    if(val < isolines[k]) {
                        isobands[idx] = k - 1;
                        break;
                    }
                }
            }
        }

        // Calculate colors for isolines
        let isolinesColors = []
        for(let i = 0; i < isolines.length; ++i){
            isolinesColors.push(Utils.lerpColor(this.colors[0], "#FFFFFF", (i + 1) / (isolines.length + 1)));
        }

        // TODO: use imageData instead of fillRect
        this.ctx.fillStyle = "#000000";
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const idx = i + j * width;
                const sum = -3 * isobands[idx] + isobands[idx + 1] + isobands[idx + width] + isobands[idx + 1 + width];
                this.ctx.fillStyle = isolinesColors[isobands[idx]];
                if(sum != 0 && sum != 4) this.ctx.fillRect(i, j, 1, 1);
            }
        }

        // Add X axis
        for(let i = 0; i < centerX / this.scale; ++i){
            this.ctx.fillText(i.toFixed(1), centerX + i * this.scale, height - 22);
            if(i != 0) this.ctx.fillText((-i).toFixed(1), centerX - i * this.scale, height - 22);
        }

        // Add Y axis
        for(let i = 0; i < centerY / this.scale; ++i){
            this.ctx.fillText(i.toFixed(1), 10, centerY + i * this.scale);
            if(i != 0) this.ctx.fillText((-i).toFixed(1), 10, centerY - i * this.scale);
        }

        const start = this.func.getStartPoint();
        this.optims = [
            new SGD(start),
            new Momentum(start),
            new AdaGrad(start),
            new RMSProp(start),
            new Adam(start)
        ];
    }
}

module.exports = GradientDescent;

},{"./animation":2,"./utils":13}],6:[function(require,module,exports){
'use strict';

// Require
// ---------------------------------------------------------------------------------------------------------------------

const GameOfLife = require("./game-of-live");
const PerlinNoiseParticles = require("./perlin-noise-particles");
const SpinningShapes = require("./spinning-shapes");
const NeuralNetwork = require("./neural-network");
const ThreeNPlusOne = require("./3n+1");
const CircularWaves = require("./circular-waves");
const ParticlesVortex = require("./particles-vortex");
const ParticlesAndAttractors = require("./particles-and-attractors");
const GradientDescent = require("./gradient-descent");

// Globals
// ---------------------------------------------------------------------------------------------------------------------

const canvas = document.getElementById("background");
const container = document.getElementById("container");
var lastWidth = 0;
var lastHeight = 0;
var needResize = false;

const colors = [ // Green palette
    "#1ABFB2",
    "#54ABA4",
    "#639598",
    "#678786",
    "#92ABA1",
    "#A5BFBC",
//    "#C5D1D2",
//    "#CCEDAE"
]

const colorsAlt = [ // Alt red palette
    "#FF5C5C",
    "#d61111",
    "#d67711",
    "#d6ab11",
    "#1142d6",
    "#5d11d6",
    "#ff905c",
    "#ffe45c",
    "#74ff5c",
    "#5cb3ff",
    "#5c72ff",
    "#875cff",
    "#ff5c5c",
];


// Create animation and init animation loop
// ---------------------------------------------------------------------------------------------------------------------

const content = document.getElementById("content");
const backgroundShow = document.getElementById("background-show");
const backgroundName = document.getElementById("background-name");
const backgroundNext = document.getElementById("background-next");
const backgroundCode = document.getElementById("background-code");
const backgroundReset = document.getElementById("background-reset");

const animations = [
    GameOfLife,
    PerlinNoiseParticles,
    SpinningShapes,
    NeuralNetwork,
    ThreeNPlusOne,
    CircularWaves,
    ParticlesVortex,
    ParticlesAndAttractors,
    //GradientDescent
];

let animationId = Math.floor(Math.random() * animations.length);
let animation = new animations[animationId](canvas, colors, colorsAlt);

var framesInterval = 0;
var then = 0;
function updateAnimation(animation) {
    let fps = animation.getFPS();
    framesInterval = 1000 / fps;
    then = Date.now();
    backgroundName.innerHTML = animation.getName();
    backgroundCode.href = animation.getCodeUrl();
    animation.resize();
}
updateAnimation(animation);


function render() {
    requestAnimationFrame(render);

    // Limit framerate
    const now = Date.now(),
          timeElapsed = now - then;
    if (timeElapsed < framesInterval) return;
    then = now;

    // Detect container size change
    const width  = Math.max(container.offsetWidth, window.innerWidth),
          height = Math.max(container.offsetHeight, window.innerHeight);
    if(width != lastWidth || height != lastHeight) needResize = true;
    else if (needResize){
        canvas.width = width;
        canvas.height = height;
        animation.resize();
        needResize = false;
    }
    lastHeight = height;
    lastWidth = width;

    animation.update(timeElapsed);
    animation.draw();
}

render();


// Add background controls
// ---------------------------------------------------------------------------------------------------------------------

backgroundShow.addEventListener("click", function(){
    if(backgroundShow.innerText == " show") {
        content.classList.remove("show-from-0");
        content.classList.add("fade-to-0");
        canvas.classList.remove("faded-8");
        canvas.classList.remove("fade-to-8");
        canvas.classList.add("hue-change");
        canvas.classList.add("show-from-8");
        backgroundShow.innerHTML = "<i class=\"fas fa-eye-slash\"></i> hide";
    } else {
        content.classList.remove("fade-to-0");
        content.classList.add("show-from-0");
        canvas.classList.remove("show-from-8");
        canvas.classList.add("fade-to-8");
        canvas.classList.remove("hue-change");
        backgroundShow.innerHTML = "<i class=\"fas fa-eye\"></i> show";
    }
});

backgroundNext.addEventListener("click", function(){
    animationId = (animationId + 1) % animations.length;
    animation = new animations[animationId](canvas, colors, colorsAlt);
    updateAnimation(animation);
});

backgroundReset.addEventListener("click", function(){
    animation = new animations[animationId](canvas, colors, colorsAlt);
    animation.resize();
});

},{"./3n+1":1,"./circular-waves":3,"./game-of-live":4,"./gradient-descent":5,"./neural-network":7,"./particles-and-attractors":9,"./particles-vortex":10,"./perlin-noise-particles":11,"./spinning-shapes":12}],7:[function(require,module,exports){
/*
 * Visualization of a simple, fully connected neural network, with random weights,
 * ReLU activations on intermediate layers, and sigmoid output at the last layer.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class NeuralNetwork extends Animation {
    constructor(canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "visualization of simple neural network", "neural-network.js");
        this.network = [];
        this.nLayers = 0;

        this.baseNodeSize = 3;
        this.baseLineSize = 1;
    }

    getFPS(){
        return 1.5; // Override default framerate
    }

    update(timeElapsed){
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

        // Draw connections
        for (let i = 0; i < this.nLayers - 1; i++) {
            let l1 = this.network[i];
            let l2 = this.network[i + 1];
            for (let n1 of l1) {
                for (let n2 of l2) {
                    const v = Utils.clip(n1.v, 0, 1);
                    const color = this.colors[this.colors.length - 1 - Math.floor(v * this.colors.length)];
                    this.ctx.globalAlpha = v;
                    Utils.drawLine(this.ctx, n1.x, n1.y, n2.x, n2.y, color, 1 + v);
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
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;

        this.network = [];

        // Number of layers depends on screen width
        this.nLayers = Utils.clip(Math.floor(width / 150), 3, 7);
        const margin = 50 * width / 500;
        const interLayer = (width - 2 * margin) / (this.nLayers - 1);
        const interNode = height / 17;

        let x = margin;
        for (let i = 0; i < this.nLayers; i++) {
            let layer = [];
            let layerNodes = 0;
            if(i == 0 || i == this.nLayers - 1) layerNodes = Math.floor(Utils.randomRange(4, 16));
            else layerNodes = Utils.randomChoice([8, 12, 16]);
            let y = height / 2 - Math.floor(layerNodes / 2) * interNode;
            if (layerNodes % 2 == 0) y += interNode/2;

            for (let j = 0; j < layerNodes; j++) {
                let n = {x: x, y: y, v: 0, w: null};
                if(i > 0) n.w = Utils.randomArray(this.network[i - 1].length, -1, 1);
                layer.push(n);
                y += interNode;
            }
            this.network.push(layer);
            x += interLayer;
        }

        this.update(0);
        this.draw();
    }
}

module.exports = NeuralNetwork;

},{"./animation":2,"./utils":13}],8:[function(require,module,exports){
/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 * Source: https://github.com/josephg/noisejs
 */

(function(global){
    var module = global.noise = {};

    function Grad(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }

    Grad.prototype.dot2 = function(x, y) {
        return this.x*x + this.y*y;
    };

    Grad.prototype.dot3 = function(x, y, z) {
        return this.x*x + this.y*y + this.z*z;
    };

    var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
        new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
        new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

    var p = [151,160,137,91,90,15,
        131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
        190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
        88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
        77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
        102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
        135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
        5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
        223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
        129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
        251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
        49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
        138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    // To remove the need for index wrapping, double the permutation table length
    var perm = new Array(512);
    var gradP = new Array(512);

    // This isn't a very good seeding function, but it works ok. It supports 2^16
    // different seed values. Write something better if you need more seeds.
    module.seed = function(seed) {
        if(seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }

        seed = Math.floor(seed);
        if(seed < 256) {
            seed |= seed << 8;
        }

        for(var i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = p[i] ^ (seed & 255);
            } else {
                v = p[i] ^ ((seed>>8) & 255);
            }

            perm[i] = perm[i + 256] = v;
            gradP[i] = gradP[i + 256] = grad3[v % 12];
        }
    };

    module.seed(0);

    /*
    for(var i=0; i<256; i++) {
      perm[i] = perm[i + 256] = p[i];
      gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
    }*/

    // Skewing and unskewing factors for 2, 3, and 4 dimensions
    var F2 = 0.5*(Math.sqrt(3)-1);
    var G2 = (3-Math.sqrt(3))/6;

    var F3 = 1/3;
    var G3 = 1/6;

    // 2D simplex noise
    module.simplex2 = function(xin, yin) {
        var n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin+yin)*F2; // Hairy factor for 2D
        var i = Math.floor(xin+s);
        var j = Math.floor(yin+s);
        var t = (i+j)*G2;
        var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
        var y0 = yin-j+t;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
            i1=1; j1=0;
        } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
            i1=0; j1=1;
        }
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1 + 2 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        i &= 255;
        j &= 255;
        var gi0 = gradP[i+perm[j]];
        var gi1 = gradP[i+i1+perm[j+j1]];
        var gi2 = gradP[i+1+perm[j+1]];
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0*x0-y0*y0;
        if(t0<0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.5 - x1*x1-y1*y1;
        if(t1<0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot2(x1, y1);
        }
        var t2 = 0.5 - x2*x2-y2*y2;
        if(t2<0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot2(x2, y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70 * (n0 + n1 + n2);
    };

    // 3D simplex noise
    module.simplex3 = function(xin, yin, zin) {
        var n0, n1, n2, n3; // Noise contributions from the four corners

        // Skew the input space to determine which simplex cell we're in
        var s = (xin+yin+zin)*F3; // Hairy factor for 2D
        var i = Math.floor(xin+s);
        var j = Math.floor(yin+s);
        var k = Math.floor(zin+s);

        var t = (i+j+k)*G3;
        var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
        var y0 = yin-j+t;
        var z0 = zin-k+t;

        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if(x0 >= y0) {
            if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
            else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
            else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
        } else {
            if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
            else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
            else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + G3; // Offsets for second corner
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;

        var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
        var y2 = y0 - j2 + 2 * G3;
        var z2 = z0 - k2 + 2 * G3;

        var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
        var y3 = y0 - 1 + 3 * G3;
        var z3 = z0 - 1 + 3 * G3;

        // Work out the hashed gradient indices of the four simplex corners
        i &= 255;
        j &= 255;
        k &= 255;
        var gi0 = gradP[i+   perm[j+   perm[k   ]]];
        var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
        var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
        var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];

        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
        if(t0<0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
        if(t1<0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
        }
        var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
        if(t2<0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
        }
        var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
        if(t3<0) {
            n3 = 0;
        } else {
            t3 *= t3;
            n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 32 * (n0 + n1 + n2 + n3);

    };

    // ##### Perlin noise stuff

    function fade(t) {
        return t*t*t*(t*(t*6-15)+10);
    }

    function lerp(a, b, t) {
        return (1-t)*a + t*b;
    }

    // 2D Perlin Noise
    module.perlin2 = function(x, y) {
        // Find unit grid cell containing point
        var X = Math.floor(x), Y = Math.floor(y);
        // Get relative xy coordinates of point within that cell
        x = x - X; y = y - Y;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; Y = Y & 255;

        // Calculate noise contributions from each of the four corners
        var n00 = gradP[X+perm[Y]].dot2(x, y);
        var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
        var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
        var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);

        // Compute the fade curve value for x
        var u = fade(x);

        // Interpolate the four results
        return lerp(
            lerp(n00, n10, u),
            lerp(n01, n11, u),
            fade(y));
    };

    // 3D Perlin Noise
    module.perlin3 = function(x, y, z) {
        // Find unit grid cell containing point
        var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
        // Get relative xyz coordinates of point within that cell
        x = x - X; y = y - Y; z = z - Z;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; Y = Y & 255; Z = Z & 255;

        // Calculate noise contributions from each of the eight corners
        var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
        var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
        var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
        var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
        var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
        var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
        var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
        var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);

        // Compute the fade curve value for x, y, z
        var u = fade(x);
        var v = fade(y);
        var w = fade(z);

        // Interpolate
        return lerp(
            lerp(
                lerp(n000, n100, u),
                lerp(n001, n101, u), w),
            lerp(
                lerp(n010, n110, u),
                lerp(n011, n111, u), w),
            v);
    };

})(this);

},{}],9:[function(require,module,exports){
/*
 * Very simple particles system with attractors.
 * In this system, distance and momentum are ignored.
 * The new velocity vector of a particle is calculated as the sum of angles
 * between the particle and all attractors (see line 51+).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class ParticlesAndAttractors extends Animation {
    constructor (canvas, colors, colorsAlt,
                 numParticles= 10000,
                 numAttractors = 5,
                 drawAttractors = false
    ) {
        super(canvas, colors, colorsAlt, "system of particles and attractors", "particles-and-attractors.js");
        this.particles = []
        this.particlesSpeed = Utils.randomRange(5, 15);

        this.drawAttractors = drawAttractors;
        this.numAttractors = numAttractors;
        this.attractorsSystem = Utils.randomChoice(["circles", "eights"]);
        this.attractorsSpeed = Utils.randomRange(0.05, 0.1) * Utils.randomChoice([-1, 1]);
        this.timeBase = Utils.randomRange(0, 10);

        for (let i = 0; i < numParticles; ++i)
            this.particles.push(Utils.rotateVec(Utils.createVec(Utils.randomRange(1, 100), 0), i));
    }

    draw() {
        Utils.blendColor(this.ctx, "#FFFFFF", 0.03, "lighter");
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        const t = (this.timeBase + this.time) * this.attractorsSpeed;

        let attractors = [];
        if(this.attractorsSystem == "circles") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / (2 * (this.numAttractors - 1));
            for (let i = 0; i < this.numAttractors; ++i)
                attractors.push(Utils.rotateVec(Utils.createVec(i * s, 0), t * i));
        } else if (this.attractorsSystem == "eights") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / this.numAttractors;
            for (let i = 0; i < this.numAttractors; ++i)
                attractors.push(Utils.rotateVec(Utils.createVec(i * t * s, 0), t * i));
        }

        for (let p of this.particles) {
            let d = 0
            for (let a of attractors) d += Math.atan2(a.y - p.y, a.x - p.x);

            const prevX = p.x, prevY = p.y;
            p.x += Math.cos(d) * this.particlesSpeed;
            p.y += Math.sin(d) * this.particlesSpeed;

            Utils.drawLine(this.ctx, prevX, prevY, p.x, p.y, this.colors[0]);
        }

        if(this.drawAttractors)
            for (let a of attractors)
                Utils.fillCircle(this.ctx, this.colorsAlt[0], a.x, a.y, 5)

        this.ctx.resetTransform();
    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");
    }
}

module.exports = ParticlesAndAttractors;

},{"./animation":2,"./utils":13}],10:[function(require,module,exports){
/*
 * Particles vortex with randomized speed and direction.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class ParticlesVortex extends Animation {
    constructor (canvas, colors, colorsAlt,
                 particles = 1500,
                 radiusMin = 100,
                 radiusMax = 200,
                 speedMin = 25,
                 speedMax = 50,
                 rotationSpeedMin = 0.01,
                 rotationSpeedMax = 0.02
    ){
        super(canvas, colors, colorsAlt, "vortex of particles", "particles-vortex.js");

        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.particles = particles;
        this.radius = Utils.randomRange(radiusMin, radiusMax);
        this.speed = Utils.randomRange(speedMin, speedMax) * Utils.randomChoice([-1, 1]);
        this.rotationSpeed = Utils.randomRange(rotationSpeedMin, rotationSpeedMax) * Utils.randomChoice([-1, 1]);
        this.dirX = Utils.randomRange(-0.75, 0.75);
        this.dirY = Utils.randomRange(-0.75, 0.75);
        this.resize();
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];

        const offset = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 4,
              centerX = this.ctx.canvas.width / 2 + this.dirX * offset,
              centerY = this.ctx.canvas.height / 2 + this.dirY * offset,
              s = Math.round(this.time * this.speed) / 2;

        this.ctx.translate(centerX, centerY);

        this.ctx.beginPath();
        for(let i = 1; i <= this.particles; i++){
            const r = this.radius + Math.pow(i / (this.particles / 1.5),2) * i / 2,
                  p = this.noise.perlin2(i * 0.1 + s, 0.1) * 100 + s * this.rotationSpeed,
                  x = Math.cos(p) * r + Math.sqrt(i * this.radius) * this.dirX,
                  y = Math.sin(p) * r + Math.sqrt(i * this.radius) * this.dirY;

            Utils.pathCircle(this.ctx, x, y, i * 0.01);
        }
        this.ctx.stroke();

        this.ctx.resetTransform();
    }
}

module.exports = ParticlesVortex;

},{"./animation":2,"./noise":8,"./utils":13}],11:[function(require,module,exports){
/*
 * Particles moving through Perlin noise.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class PerlinNoiseParticles extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlePer100PixSq = 4,
                noiseScale = 0.001,
                drawNoise = false
    ) {
        super(canvas, colors, colorsAlt, "particles moving through Perlin noise", "perlin-noise-particles.js");
        this.particlePer100PixSq = particlePer100PixSq;
        this.noiseScale = noiseScale;
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));
        this.drawNoise = drawNoise;

        this.width = 0;
        this.height = 0;
        this.particles = [];
        this.imageData = null;
    }

    update(timeElapsed) {
        // TODO: Make it time dependent
        for(let p of this.particles){
            const angle = this.noise.perlin2(p.x * this.noiseScale, p.y * this.noiseScale) * 2 * Math.PI / this.noiseScale;
            p.prevX = p.x;
            p.prevY = p.y;
            p.x += Math.cos(angle) * p.speed;
            p.y += Math.sin(angle) * p.speed;
        }
    }

    draw() {
        for(let p of this.particles){
            // Utils.fillCircle(this.ctx, p.color, p.x, p.y, p.radius);
            Utils.drawLine(this.ctx, p.prevX, p.prevY, p.x, p.y, p.color, 2 * p.radius); // This results with better antialiasing
        }
        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    spawnParticles(x, y, width, height) {
        let newParticles = width / 100 * height / 100 * this.particlePer100PixSq;

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            const particleX = Math.random() * width + x,
                  particleY = Math.random() * height + y;
            this.particles.push({
                x: particleX,
                y: particleY,
                prevX: particleX,
                prevY: particleY,
                speed: Math.random() * 0.20 + 0.10,
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
        if(this.drawNoise) {
            const gridWidth = this.ctx.canvas.width * this.noiseScale,
                  gridHeight = this.ctx.canvas.height * this.noiseScale,
                  pixelSize = 10,
                  numPixels = gridWidth / this.ctx.canvas.width * pixelSize;

            for (let y = 0; y < gridHeight; y += numPixels) {
                for (let x = 0; x < gridWidth; x += numPixels) {
                    let v = Math.floor(this.noise.perlin2(x, y) * 250);
                    this.ctx.fillStyle = 'hsl(' + v + ',50%,50%)';
                    this.ctx.fillRect(x / gridWidth * this.ctx.canvas.width, y / gridHeight * this.ctx.canvas.height, pixelSize, pixelSize);
                }
            }
        }
    }
}

module.exports = PerlinNoiseParticles;

},{"./animation":2,"./noise":8,"./utils":13}],12:[function(require,module,exports){
/*
 * Shapes moving in a circle.
 * Based on: https://observablehq.com/@rreusser/instanced-webgl-circles
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class SpinningShapes extends Animation {
    constructor (canvas, colors, colorsAlt, shapes = 500, sides = [0], rotatePolygons = false) {
        super(canvas, colors, colorsAlt, "", "spinning-shapes.js");

        const shapeSides = [0, 3, 4, 5, 6, 8];
        const shapeNames = ["circles", "triangles", "rectangles", "pentagons", "hexagons", "octagons"];
        this.sides = Utils.randomChoice(sides);
        this.rotatePolygons = rotatePolygons;
        this.shapes = shapes;
        this.name = shapeNames[shapeSides.indexOf(this.sides)] + " moving in a circle";

        this.distBase = 0.6;
        this.distVar = 0.2;
        this.sizeBase = 0.2;
        this.sizeVar = 0.12;
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        const scale = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3;

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        for (let i = 0; i < this.shapes; ++i) {
            const theta = i / this.shapes * 2 * Math.PI,
                  distance = (this.distBase + this.distVar * Math.cos(theta * 6 + Math.cos(theta * 8 + this.time / 2))) * scale,
                  x = Math.cos(theta) * distance,
                  y = Math.sin(theta) * distance,
                  radius = (this.sizeBase + this.sizeVar * Math.cos(theta * 9 - this.time)) * scale;
            this.ctx.strokeStyle = this.colors[Math.floor((Math.cos(theta * 9 - this.time) + 1) / 2 * this.colors.length)];
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            if(this.sides == 0) Utils.pathCircle(this.ctx, x, y, radius);
            else Utils.pathPolygon(this.ctx, x, y, radius, this.sides, theta * this.rotatePolygons);
            this.ctx.stroke();
        }

        this.ctx.resetTransform();
    }
}

module.exports = SpinningShapes

},{"./animation":2,"./utils":13}],13:[function(require,module,exports){
module.exports = {

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    randomBoxMuller() {
        return Math.sqrt(-2.0 * Math.log( 1 - Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
    },

    randomArray(length, min, max){
        return Array(length).fill().map(() => this.randomRange(min, max))
    },

    clip(value, min, max){
        return Math.max(min, Math.min(max, value));
    },

    remap(val, min1, max1, min2, max2){
        const range1 = max1 - min1,
              range2 = max2 - min2;
        return min2 + (val - min1) / range1 * range2;
    },

    sum(arr){
        let s = 0;
        for(let e of arr) s += a;
        return s;
    },

    // Function to linearly interpolate between v1 and v2
    lerp(v1, v2, t) {
        return (1.0 - t) * v1 + t * v2;
    },

    // Based on: https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
    lerpColor(a, b, t) {
        const ah = parseInt(a.replace('#', '0x'), 16);
              ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
              bh = parseInt(b.replace('#', '0x'), 16),
              br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,

              rr = ar + t * (br - ar),
              rg = ag + t * (bg - ag),
              rb = ab + t * (bb - ab);

        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    },

    clear(ctx, color){
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    },

    pathLine(ctx, x1, y1, x2, y2){
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    },

    drawLine(ctx, x1, y1, x2, y2, color, width = 1){
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    },

    pathPolygon(ctx, x, y, radius, sides, rotation = 0){
        const angle = 2 * Math.PI / sides;
        ctx.moveTo(x + radius * Math.cos(rotation), y + radius * Math.sin(rotation));
        for (let i = 1; i <= sides; i++) {
            ctx.lineTo(x + radius * Math.cos(rotation + i * angle), y + radius * Math.sin(rotation + i * angle));
        }
    },

    pathCircle(ctx, x, y, radius){
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
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

    blendColor(ctx, color, alpha = 1.0, globalCompositeOperation = 'source-over'){
        ctx.save();
        ctx.globalCompositeOperation = globalCompositeOperation;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    },

    createVec(x, y){
        return {x: x, y: y};
    },

    rotateVec(vec, r){
        const cos = Math.cos(r), sin = Math.sin(r);
        return {x: vec.x * cos - vec.y * sin, y: vec.x * sin + vec.y * cos};
    },

    isStrictMode(){
        return ((eval("var __temp = null"), (typeof __temp === "undefined")) ? "strict":  "non-strict");
    }
};

},{}]},{},[6])