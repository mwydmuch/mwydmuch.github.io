(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

class GameOfLife {
    constructor (canvas, colors, cellSize = 10) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.cellSize = cellSize;
        this.colors = colors;
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

module.exports = GameOfLife

},{}],2:[function(require,module,exports){
'use strict';

// Require
// ---------------------------------------------------------------------------------------------------------------------

const GameOfLife = require("./gameoflive");
const PerlinNoise = require("./perlinnoise");


// Globals
// ---------------------------------------------------------------------------------------------------------------------

const canvas = document.getElementById("background");
const container = document.getElementById("container");
var lastWidth = 0;
var lastHeight = 0;
var needResize = false;

var fps = 15; // Due to performance concerns, run all the animations at 15 frames per second
var fpsInterval = 1000 / fps;
var then = Date.now();

const colors = [ // Green
    "#639598",
    "#678786",
    "#92ABA1",
    "#A5BFBC",
    "#C5D1D2"
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
    PerlinNoise
]

//var animation = new GameOfLife(canvas, colors);
//var animation = new PerlinNoise(canvas, colors);

const animation = new animations[Math.floor(Math.random() * animations.length)](canvas, colors);
const content = document.getElementById("content");
const backgroundName = document.getElementById("background-name");
backgroundName.innerHTML += animation.getName();
backgroundName.addEventListener("mouseover", function(){
    content.classList.remove("show-from-0");
    content.classList.add("fade-to-0");
    canvas.classList.remove("faded-10");
    canvas.classList.remove("fade-to-10");
    //canvas.classList.remove("hue-change");
    canvas.classList.add("show-from-10");
});
backgroundName.addEventListener("mouseout", function(){
    content.classList.remove("fade-to-0");
    content.classList.add("show-from-0");
    canvas.classList.remove("show-from-10");
    canvas.classList.add("fade-to-10");
    //canvas.classList.add("hue-change");
});

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

},{"./gameoflive":1,"./perlinnoise":3}],3:[function(require,module,exports){
'use strict';

class PerlinNoise {
    constructor(canvas, colors, particlePer100PixSq = 4, noiseScale = 1200) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.width = 0;
        this.height = 0;
        this.particlePer100PixSq = particlePer100PixSq;
        this.colors = colors;
        this.particles = [];
        this.imageData = null;

        // To make it more efficient use "memory" of gradients and values already calculated for Perlin Noise
        this.noiseScale = noiseScale;
        this.noiseGradients = {};
        this.noiseMemory = {};
        this.resize();
    }

    getName(){
        return "particles moving through Perlin noise"
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

    getNoise(x, y) {
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

    update(elapsed) {
        for(let i = 0; i < this.particles.length; i++){
            let angle = this.getNoise(this.particles[i].x / this.noiseScale, this.particles[i].y / this.noiseScale) * 2 * Math.PI * this.noiseScale;
            this.particles[i].x += Math.cos(angle) * this.particles[i].speed;
            this.particles[i].y += Math.sin(angle) * this.particles[i].speed;
        }
    }

    draw() {
        for(let i = 0; i < this.particles.length; i++) {
            this.ctx.fillStyle = this.particles[i].color;
            this.ctx.beginPath();
            this.ctx.arc(this.particles[i].x, this.particles[i].y, this.particles[i].radius, 0, 2 * Math.PI, false);
            this.ctx.fill();
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    spanParticles(x, y, width, height) {
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
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        if(this.imageData != null) this.ctx.putImageData(this.imageData, 0, 0);

        // Add particles to new parts of the image
        let divWidth = this.ctx.canvas.width - this.width;
        let divHeight = this.ctx.canvas.height - this.height;

        if(divWidth > 0) this.spanParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spanParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spanParticles(this.width, this.height, divWidth, divHeight);

        this.width = Math.max(this.ctx.canvas.width, this.width);
        this.height = Math.max(this.ctx.canvas.height, this.height);

        // Visualize Perlin noise
        // const gridWidth = this.ctx.canvas.width / this.moveScale;
        // const gridHeight = this.ctx.canvas.height / this.moveScale;
        // const pixelSize = 20;
        // const numPixels = gridWidth / this.ctx.canvas.width * pixelSize;
        // for (let y = 0; y < gridHeight; y += numPixels){
        //     for (let x = 0; x < gridWidth; x += numPixels){
        //         let v = parseInt(this.getNoise(x, y) * 250);
        //         this.ctx.fillStyle = 'hsl(' + v + ',50%,50%)';
        //         this.ctx.fillRect(x / gridWidth * this.ctx.canvas.width, y / gridHeight * this.ctx.canvas.height, pixelSize, pixelSize);
        //     }
        // }
    }
}

module.exports = PerlinNoise

},{}]},{},[2])