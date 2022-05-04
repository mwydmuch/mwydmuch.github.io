(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * 3n + 1 (Collatz Conjecture) visualization.
 * Inspired by Veritasium video: https://www.youtube.com/watch?v=094y1Z2wpJg
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");

class ThreeNPlusOne extends Animation {
    constructor(canvas, colors, colorsAlt,
                length = 30,
                evenAngle = 8,
                oddAngle = -20,
                drawNumbers = false,
                scale = 1
    ) {
        super(canvas, colors, colorsAlt, "3n + 1 (Collatz Conjecture) visualization", "3n+1.js");
        this.length = length;
        this.evenAngle = evenAngle;
        this.oddAngle = oddAngle;
        this.scale = scale;
        this.drawNumbers = drawNumbers;

        this.seqences = [];
    }

    update(elapsed){
        let n = this.seqences.length + 1;
        let sequence = [n];
        while(n !== 1){
            if(n % 2) n = 3 * n + 1;
            else n /= 2;
            sequence.push(n);
        }
        this.seqences.push(sequence);
    }

    drawSequence(sequence) {
        let x = 0, y = 0,
            angle = 270 * Math.PI / 180;
        const color = this.colors[this.frame % this.colors.length];

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = color;

        for(let i = sequence.length - 2; i >= 0; --i){
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);

            if(sequence[i] % 2) angle += this.oddAngleRad;
            else angle += this.evenAngleRad;

            if(this.drawNumbers){
                const sin = Math.cos(angle),
                      cos = Math.sin(angle);
                x += this.length / 2 * sin;
                y += this.length / 2 * cos;
                this.ctx.fillText(sequence[i], x + 10, y);
                x += this.length / 2 * sin;
                y += this.length / 2 * cos;
            } else {
                x += this.length * Math.cos(angle);
                y += this.length * Math.sin(angle);
            }
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }

    draw() {
        this.evenAngleRad = this.evenAngle * Math.PI / 180;
        this.oddAngleRad = this.oddAngle * Math.PI / 180;

        this.ctx.translate(this.ctx.canvas.width / 2,  this.ctx.canvas.height);
        this.ctx.scale(this.scale, this.scale);

        while(this.frame < this.seqences.length){
            this.drawSequence(this.seqences[this.frame]);
            ++this.frame;
        }
        this.ctx.resetTransform();
    }

    resize() {
        this.frame = 0;
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    getSettings() {
        return [{
            prop: "length",
            type: "int",
            min: 1,
            max: 100,
            toCall: "resize",
        },
        {
            prop: "evenAngle",
            type: "int",
            min: -45,
            max: 45,
            toCall: "resize",
        },
        {
            prop: "oddAngle",
            type: "int",
            min: -45,
            max: 45,
            toCall: "resize",
        },
        {
            prop: "drawNumbers",
            type: "bool",
            toCall: "resize",
        }, {
            prop: "scale",
            type: "float",
            min: 0.05,
            max: 1.95,
            toCall: "resize",
        }];
    }
}

module.exports = ThreeNPlusOne;

},{"./animation":2}],2:[function(require,module,exports){
/*
 * Base class for all the background animations.
 */

const Utils = require("./utils");

class Animation {
    constructor(canvas, colors, colorsAlt, name, file) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.bgColor = "#FFFFFF";
        this.colors = colors;
        this.colorsAlt = colorsAlt;
        this.colorA = colors[0];
        this.colorB = colors[3];

        this.name = name;
        this.file = file;
        this.time = 0;
        this.frame = 0;
    }

    assignAndCheckIfRandom(value, random){  // Commonly used by many constructors
        if(value === "random") return random;
        else return value;
    }

    fadeOut(alpha) {  // Commonly used by some animations
        if (alpha <= 0.001 && this.frame % 10 === 0) Utils.blendColor(this.ctx, this.bgColor, alpha * 10, "lighter");
        else if (alpha <= 0.005 && this.frame % 2 === 0) Utils.blendColor(this.ctx, this.bgColor, alpha * 2, "lighter");
        else Utils.blendColor(this.ctx, this.bgColor, alpha, "lighter");
    }

    getFPS(){
        return 30;
    }

    getName(){
        return this.name;
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/src/" + this.file;
    }

    update(elapsed){
        // By default just update timer and frame count
        this.time += elapsed / 1000;
        ++this.frame;
    }

    resize(){
        // By default do nothing
    }

    getSettings() {
        return [] // By default there is no settings
    }
}

module.exports = Animation;

},{"./utils":18}],3:[function(require,module,exports){
/*
 * Modified method of L. Cremona for drawing cardioid with a pencil of lines,
 * as described in section "cardioid as envelope of a pencil of lines" of:
 * https://en.wikipedia.org/wiki/Cardioid
 * Here the shift of the second point is determined by time passed
 * from the beginning of the animation.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class Cardioids extends Animation {
    constructor (canvas, colors, colorsAlt,
                 lines = 400,
                 scale = 1.0,
                 speed = 0.05,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, "cardioids with a pencil of lines", "cardioids.js");

        this.lines = lines;
        this.scale = scale;
        this.speed = speed;
        this.rainbowColors = rainbowColors;

        this.radius = 0;
        this.position = 0;
    }

    getVec(i){
        const angle = Utils.remap(i, 0, this.lines, 0, 2 * Math.PI);
        return Utils.rotateVec2d(Utils.createVec2d(this.radius, 0), Math.PI + angle);
    }

    update(elapsed){
        this.time += elapsed / 1000;
        ++this.frame;
        this.position += elapsed / 1000 * this.speed;
    }

    draw() {
        Utils.clear(this.ctx, this.bgColor);

        this.radius = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3 * this.scale;
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        Utils.strokeCircle(this.ctx, 0, 0, this.radius, this.colors[0]);

        for (let i = 0; i <= this.lines; ++i) {
            const a = this.getVec(i),
                  b = this.getVec(i * this.position);
            let color;
            if(this.rainbowColors) color = 'hsl(' + i / this.lines * 360 + ', 100%, 75%)';
            else color = Utils.lerpColorsPallet([this.colorA, this.colorB, this.colorA], i / this.lines);
            Utils.drawLine(this.ctx, a.x, a.y, b.x, b.y, color, 1);
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{
            prop: "lines",
            type: "int",
            min: 1,
            max: 2500,
        }, {
            prop: "speed",
            type: "float",
            min: -1.0,
            max: 1.0,
        }, {
            prop: "scale",
            type: "float",
            min: 0.25,
            max: 1.75,
        }, {
            prop: "rainbowColors",
            type: "bool",
        }];
    }
}

module.exports = Cardioids

},{"./animation":2,"./utils":18}],4:[function(require,module,exports){
/*
 * Circular waves animation.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class CircularWaves extends Animation {
    constructor(canvas, colors, colorsAlt,
                vertexes = 180,
                noiseScale = 0.5,
                radiusScaleMin = 0.4,
                radiusScaleMax = 1.2,
                fadingSpeed = 0.001,
                rainbowColors = false
    ) {
        super(canvas, colors, colorsAlt, "circular waves", "circular-waves.js");
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.vertexes = vertexes;
        this.noiseScale = noiseScale;
        this.radiusScaleMin = radiusScaleMin;
        this.radiusScaleMax = radiusScaleMax;
        this.fadingSpeed = fadingSpeed;
        this.rainbowColors = rainbowColors;

        this.radiusMin = 0;
        this.radiusMax = 0;
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        const zoff = this.frame * 0.005;
        const degPerVertex = 360 / this.vertexes;
        if(this.rainbowColors) this.ctx.strokeStyle = 'hsl(' + Math.abs(Math.sin(zoff * 5)) * 360 + ', 100%, 50%)';
        else this.ctx.strokeStyle = Utils.lerpColor(this.colorA, this.colorB, Math.abs(Math.sin(zoff * 5)));

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        this.ctx.beginPath();
        for (let a = 0; a <= 360; a += degPerVertex) {
            const aRad = a * Math.PI / 180,
                  xoff = Math.cos(aRad) * this.noiseScale,
                  yoff = Math.sin(aRad) * this.noiseScale,

                  n = this.noise.simplex3(xoff, yoff, zoff),
                  r = Utils.remap(n, -1, 1, this.radiusMin, this.radiusMax),
                  x = r * Math.cos(aRad),
                  y = r * Math.sin(aRad);

            if(a === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        this.ctx.resetTransform();
    }

    resize() {
        this.radiusMin = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.radiusScaleMin;
        this.radiusMax = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.radiusScaleMax;
        if(this.radiusMin > this.radiusMax) [this.radiusMin, this.radiusMax] = [this.radiusMax, this.radiusMin];
        Utils.clear(this.ctx, "#FFFFFF");
    }

    getSettings() {
        return [{
            prop: "vertexes",
            type: "int",
            min: 3,
            max: 720,
            toCall: "resize",
        }, {
            prop: "radiusScaleMin",
            type: "float",
            min: 0,
            max: 2.0,
            toCall: "resize",
        }, {
            prop: "radiusScaleMax",
            type: "float",
            min: 0,
            max: 2.0,
            toCall: "resize",
        }, {
            prop: "noiseScale",
            type: "float",
            min: 0,
            max: 2.0,
            toCall: "resize",
        }, {
            prop: "fadingSpeed",
            type: "float",
            step: 0.001,
            min: 0,
            max: 0.1,
        }, {
            prop: "rainbowColors",
            type: "bool",
        }];
    }
}

module.exports = CircularWaves;

},{"./animation":2,"./noise":10,"./utils":18}],5:[function(require,module,exports){
/*
 * Conway's game of life visualization with isometric rendering.
 * Cells that "died" in the previous step keep their color to achieve a stable image
 * (flickering is not good for a background image).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const GameOfLife = require("./game-of-live");
const Utils = require("./utils");

class GameOfLifeIsometric extends GameOfLife {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 12,
                 cellBasePadding = 0,
                 spawnProb = 0.5,
                 fadeDeadCells = true) {
        super(canvas, colors, colorsAlt, cellSize, cellBasePadding, spawnProb);
        this.name = "isometric Conway's game of life";
        this.file = "game-of-live-isometric.js";
        this.fadeDeadCells = fadeDeadCells;

        this.sqrt3 = Math.sqrt(3);
        this.xShift = this.cellSize * this.sqrt3 / 2;
        this.yShift = this.cellSize / 2;

        // Prerender cubes for better performance
        this.renderedGrid = null;
        this.renderedCubes = [];
        let offCtx = Utils.createOffscreenCanvas(4 * this.xShift, 4 * this.yShift).getContext('2d');
        this.drawIsoCube(offCtx, 0, 3 * this.yShift, true, true, this.colors, 0, this.cellSize);
        this.renderedCubes.push(offCtx.canvas);

        for(let i = 1; i < this.cellSize; ++i){
            offCtx = Utils.createOffscreenCanvas(4 * this.xShift, 4 * this.yShift).getContext('2d');
            this.drawIsoCube(offCtx, 0, 3 * this.yShift, true, true, this.colorsAlt, -i, this.cellSize);
            this.renderedCubes.push(offCtx.canvas);
        }
    }

    drawIsoCube(ctx, isoX, isoY, drawFront, drawSide, colors, heightMod, size) {
        const xShift = size * this.sqrt3 / 2,
              yShift = size / 2;

        heightMod *= -1; //*= -2 * yShift;
        ctx.strokeStyle = colors[0];

        ctx.fillStyle = colors[3];
        ctx.beginPath();
        Utils.pathClosedShape(ctx,[
            [isoX, isoY - 2 * yShift + heightMod],
            [isoX + xShift, isoY - yShift + heightMod],
            [isoX + 2 * xShift, isoY - 2 * yShift + heightMod],
            [isoX + xShift, isoY - 3 * yShift + heightMod]]);
        ctx.fill();
        ctx.stroke();

        if(drawFront) { // Small optimization
            ctx.fillStyle = colors[2];
            ctx.beginPath();
            Utils.pathClosedShape(ctx, [
                [isoX, isoY],
                [isoX + xShift, isoY + yShift],
                [isoX + xShift, isoY - yShift + heightMod],
                [isoX, isoY - 2 * yShift + heightMod]]);
            ctx.fill();
            ctx.stroke();
        }

        if(drawSide) { // Small optimization
            ctx.fillStyle = colors[1];
            ctx.beginPath();
            Utils.pathClosedShape(ctx, [
                [isoX + xShift, isoY + yShift],
                [isoX + 2 * xShift, isoY],
                [isoX + 2 * xShift, isoY - 2 * yShift + heightMod],
                [isoX + xShift, isoY - yShift + heightMod]]);
            ctx.fill();
            ctx.stroke();
        }
    }

    drawCube(x, y, colors, heightMod=0, padding=0) {
        const isoX = x * this.xShift - y * this.xShift,
              isoY = (x + y + 1) * this.yShift;

        this.drawIsoCube(this.ctx, isoX, isoY, !this.isAlive(x, y + 1), !this.isAlive(x + 1, y), colors, heightMod, this.cellSize - 2 * padding);
    }

    drawGrid(ctx, x, y){
        const westX = this.gridHeight * -this.xShift,
              westY = this.gridHeight * this.yShift,
              eastX = this.gridWidth * this.xShift,
              eastY = this.gridWidth * this.yShift,
              southX = (-this.gridHeight + this.gridWidth) * this.xShift,
              southY = (this.gridHeight + this.gridWidth) * this.yShift,
              color = this.colors[0];

        // Draw grid
        for (let i = 0; i < this.gridHeight; ++i) {
            const x = i * -this.xShift,
                y = i * this.yShift;
            Utils.drawLine(ctx, x, y, x + eastX, y + eastY, color);
            Utils.drawLine(ctx, -x, y, -x + westX, y + westY, color);
        }

        // Draw outline
        Utils.drawLine(ctx, 0, 0, eastX, eastY, color, 3);
        Utils.drawLine(ctx, 0, 0, westX, westY, color, 3);
        Utils.drawLine(ctx, westX, westY, southX, southY, color, 3);
        Utils.drawLine(ctx, eastX, eastY, southX, southY, color, 3);
    }

    drawPrerenderedCube(x, y, idx){
        const isoX = x * this.xShift - y * this.xShift,
              isoY = (x + y + 1) * this.yShift;

        this.ctx.drawImage(this.renderedCubes[idx], isoX - 1 * this.xShift, isoY - 3 * this.yShift);
    }

    draw() {
        Utils.clear(this.ctx, this.bgColor);

        // Draw grid
        if(!this.renderedGrid){
            let offCtx = Utils.createOffscreenCanvas(this.ctx.canvas.width, this.ctx.canvas.height).getContext('2d');
            offCtx.translate(this.ctx.canvas.width / 2, 1/8 * this.ctx.canvas.height);
            this.drawGrid(offCtx, 0, 0);
            this.renderedGrid = offCtx.canvas;
        }
        this.ctx.drawImage(this.renderedGrid, 0, 0);

        this.ctx.translate(this.ctx.canvas.width / 2, 1/8 * this.ctx.canvas.height);

        // Draw blocks
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let cellVal = this.getVal(x, y);
                if(this.fadeDeadCells && cellVal > -(this.cellSize - 2 * this.cellBasePadding))
                    //this.drawCube(x, y, this.colorsAlt, Math.min(0, cellVal), this.cellBasePadding);
                    this.drawPrerenderedCube(x, y, Math.max(0, -cellVal));
                else if (cellVal > 0) this.drawPrerenderedCube(x, y, 0);
            }
        }

        this.ctx.resetTransform();
    }

    resize() {
        // Fill the whole screen (bad performance on low spec computers/mobile devices)
        //const newGridSize = Math.ceil((this.ctx.canvas.height + this.isoH) / this.cellSize);

        const newGridSize = Math.ceil( 3/4 * this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridSize, newGridSize);
        this.renderedGrid = null;
    }

    getSettings() {
        return [{
            prop: "fadeDeadCells",
            type: "bool",
        }];
    }
}

module.exports = GameOfLifeIsometric;

},{"./game-of-live":6,"./utils":18}],6:[function(require,module,exports){
/*
 * Conway's game of life visualization.
 * Cells that "died" in the previous step keep their color to achieve a stable image
 * (flickering is not good for a background image).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");

class GameOfLife extends Animation {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 12,
                 cellPadding = 1,
                 spawnProb= 0.5,
                 cellShape = "square",
                 deadCellsFadingSteps = 5) {
        super(canvas, colors, colorsAlt, "Conway's game of life", "game-of-live.js");
        this.cellSize = cellSize;
        this.cellBasePadding = cellPadding;
        this.spawnProb = spawnProb;
        this.cellShape = cellShape;
        this.deadCellsFadingSteps = deadCellsFadingSteps;

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
        // if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return 0;
        // else return (this.getVal(x, y) >= 1) ? 1 : 0;
        return (this.getVal(x % this.gridWidth, y % this.gridHeight) >= 1) ? 1 : 0;
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
                if (numAlive == 2 && this.grid[cellIdx] >= 1) this.gridNextState[cellIdx] = this.grid[cellIdx] + 1;
                else if (numAlive == 3) this.gridNextState[cellIdx] = Math.max(1, this.grid[cellIdx] + 1);
                else this.gridNextState[cellIdx] = Math.min(0, this.grid[cellIdx] - 1);
            }
        }

        [this.grid, this.gridNextState] = [this.gridNextState, this.grid];
    }

    drawSquareCell(x, y, cellPadding){
        this.ctx.fillRect(x * this.cellSize + cellPadding, y * this.cellSize + cellPadding,
            this.cellSize - 2 * cellPadding, this.cellSize - 2 * cellPadding);
    }

    drawCircleCell(x, y, cellPadding){
        this.ctx.beginPath();
        this.ctx.arc(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - cellPadding, 0, 2 * Math.PI, false);
        this.ctx.fill();
    }

    draw() {
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if(this.cellShape === "square") this.drawCell = this.drawSquareCell;
        else this.drawCell = this.drawCircleCell;

        const maxPadding = this.cellSize / 2 - this.cellBasePadding,
              paddingPerStep = maxPadding / (this.deadCellsFadingSteps + 1);

        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                const cellVal = this.getVal(x, y);
                let cellPadding = this.cellBasePadding,
                    fillStyle = null,
                    valCond = -1;
                if(cellVal > 0) fillStyle = this.colors[0];
                else {
                    for (let i = 0; i < this.deadCellsFadingSteps; ++i) {
                        if (cellVal > valCond) {
                            fillStyle = this.colors[Math.min(i, this.colors.length - 1)];
                            cellPadding += i * paddingPerStep;
                            break;
                        }
                        valCond *= 2;
                    }
                }
                if(fillStyle) {
                    this.ctx.fillStyle = fillStyle;
                    this.drawCell(x, y, cellPadding);
                }
            }
        }
    }

    resizeGrid(newGridWidth, newGridHeight){
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; y++) {
            for (let x = 0; x < newGridWidth; x++) {
                let cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(x, y)];
                else newGrid[cellCord] = (Math.random() < this.spawnProb) ? 1 : -99999;
            }
        }

        this.grid = newGrid;
        this.gridNextState = [...this.grid];
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{
            prop: "cellSize",
            type: "int",
            min: 4,
            max: 32,
            toCall: "resize",
        }, {
            prop: "cellShape",
            type: "select",
            values: ["square", "circle"],
        }, {
            prop: "deadCellsFadingSteps",
            type: "int",
            min: 0,
            max: 8,
        }];
    }
}

module.exports = GameOfLife;

},{"./animation":2}],7:[function(require,module,exports){
/*
 * Visualization of gradient descent-based optimizers.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");


// Optimizers
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

class AdaMax extends Optim {
    constructor (w) {
        super(w, "AdaMax");
        this.alpha = 0.001;
        this.beta1 = 0.9;
        this.beta2 = 0.999;
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = Math.max(this.beta2 * this.v[i], Math.abs(grad[i]));
            this.w[i] -= this.alpha / (this.v[i] + 0.000001) * this.m[i] / (1 - this.beta1);
        }
    }
}

class AMSGrad extends Optim {
    constructor (w) {
        super(w, "AMSGrad");
        this.alpha = 0.001;
        this.beta1 = 0.9;
        this.beta2 = 0.999;
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = Math.max(this.beta2 * this.v[i] + (1 - this.beta2) * grad[i] * grad[i], this.v[i]);
            this.w[i] -= this.alpha / (Math.sqrt(this.v[i]) + 0.000001) * this.m[i];
        }
    }
}

// Benchmark functions
class Func {
    constructor(name, globalMin, startPoints, scale, shift=[0, 0], steps= 400) {
        this.name = name;
        this.globalMin = globalMin;
        this.startPoints = startPoints;
        this.scale = scale;
        this.steps = steps;
        this.shift = shift;
    }

    val(w) {
        return 0;
    }

    grad(w){
        return w;
    }

    hasGlobalMin(){
        return this.globalMin !== null;
    }

    getGlobalMin(){
        return Utils.subArrays(this.globalMin, this.shift);
    }

    getStartPoint(){
        return Utils.subArrays(Utils.randomChoice(this.startPoints), this.shift);
    }

    getScale(){
        return this.scale;
    }

    getSteps(){
        return this.steps;
    }

    getName(){
        return this.name;
    }
}


class SaddlePointFunc extends Func {
    constructor() {
        super("Two-dimensional non-convex function with saddle point: f(x, y) = x^2 - y^2",
            null, [[-1, 0.001], [-1, -0.0001], [1, 0.01], [1, -0.001]], 1.1);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return x * x - y * y;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return [
            2 * x,
            -2 * y
        ]
    }
}


class BealeFunc extends Func{
    constructor() {
        super("Two-dimensional non-convex BEALE function",
            [3, 0.5], [[0.2, 0.7], [2, 2], [-1, -1.3], [-1.4, -1.7], [4, -1.1]], 2.2, [2, 0]);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return Math.pow(1.5 - x + x * y, 2) + Math.pow(2.25 - x + x * y * y, 2) + Math.pow(2.625 - x + x * Math.pow(y, 3), 2);
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            y2 = y * y,
            y3 = y2 * y,
            y4 = y3 * y,
            y5 = y4 * y,
            y6 = y5 * y;
        return [
            2 * x * (y6 + y4 - 2 * y3 - y2 - 2 * y + 3) + 5.25 * y3 + 4.5 * y2 + 3 * y - 12.75,
            6 * x * (x * (y5 + 2/3 * y3 - y2 - 1/3 * y - 1/3) + 2.625 * y2 + 1.5 * y + 0.5)
        ]
    }
}


class StyblinskiTangFunc extends Func{
    constructor() {
        super("Two variables non-convex Stybliski-Tang function",
            [-2.903534, -2.903534], [[0, 5], [0, -5], [5, 0], [-5, 0], [-0.5, -5], [-5, -0.5]], 5.5);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            x2 = x * x,
            x4 = x2 * x2,
            y2 = y * y,
            y4 = y2 * y2;
        return ((x4 - 16 * x2 + 5 * x) + (y4 - 16 * y2 + 5 * y)) / 2 + 78.33188;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            x3 = Math.pow(x, 3),
            y3 = Math.pow(y, 3);
        return [
            2 * x3 - 16 * x - 5 / 2,
            2 * y3 - 16 * y - 5 / 2
        ]
    }
}


class GradientDescent extends Animation {
    constructor (canvas, colors, colorsAlt, functionToOptimize = "random") {
        super(canvas, colors, colorsAlt, "visualization of gradient descent algorithms", "gradient-descent.js");
        this.funcNames = ["with saddle point", "Beale", "Styblinski-Tang"];
        this.functionToOptimize = this.assignAndCheckIfRandom(functionToOptimize, Utils.randomChoice(this.funcNames));
        this.funcClasses = [SaddlePointFunc, BealeFunc, StyblinskiTangFunc];

        this.scale = 0;
        this.optims = null;
        this.imageData = null;
    }

    draw() {
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

        if (this.frame >= this.func.getSteps()) this.resize();
    }
    
    // TODO: refactor
    resize() {
        Utils.clear(this.ctx, this.bgColor);
        
        // Create function
        let funcCls = this.funcClasses[this.funcNames.indexOf(this.functionToOptimize)];
        this.func = new funcCls();
        
        this.frame = 0;
        this.imageData = null;

        const width = this.ctx.canvas.width,
              height = this.ctx.canvas.height,
              centerX = width / 2,
              centerY = height / 2;
        this.scale = Math.min(width, height) / this.func.getScale() / 2;
        this.ctx.fillStyle = this.colors[0];
        this.ctx.font = '12px sans-serif';

        // Create visualization of the function
        let isobands = new Array(width * height);
        let isolines, exp, plusVal, shiftVal = 0;

        // Decide on a scale
        if(this.func.hasGlobalMin()) {
            shiftVal = this.func.val(this.func.getGlobalMin());
            isolines = [0, 0.125];
            exp = 1.5;
            plusVal = 0;
        } else {
            shiftVal = 0;
            const scale = this.func.getScale(),
                  vals = [
                    this.func.val([0, 0]),
                    this.func.val([scale, 0]),
                    this.func.val([0, scale]),
                    this.func.val([-scale, 0]),
                    this.func.val([0, -scale]),
                    this.func.val([scale, scale]),
                    this.func.val([-scale, -scale]),
                    this.func.val([scale, -scale]),
                    this.func.val([-scale, scale]),
                  ],
                  min = Math.min(...vals),
                  max = Math.max(...vals);
            isolines = [min];
            exp = 1;
            plusVal = (max - min) / 15;
        }

        // Very simple approach to draw the isolines (my simplified version of the marching squares algorithm)
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const x = (i - centerX) / this.scale, y = -(j - centerY) / this.scale,
                      val = this.func.val([x, y]),
                      idx = i + j * width;

                while(val > shiftVal + isolines[isolines.length - 1]) isolines.push(isolines[isolines.length - 1] * exp + plusVal);
                for(let k = 1; k < isolines.length; ++k) {
                    if(val < shiftVal + isolines[k]) {
                        isobands[idx] = k - 1;
                        break;
                    }
                }
            }
        }

        // Calculate colors for the isolines
        let isolinesColors = []
        for(let i = 0; i < isolines.length; ++i){
            isolinesColors.push(Utils.lerpColor(this.colors[0], this.colors[this.colors.length - 1], (i + 1) / (isolines.length + 1)));
        }

        // TODO: use imageData instead of fillRect
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const idx = i + j * width;
                const sum = -3 * isobands[idx] + isobands[idx + 1] + isobands[idx + width] + isobands[idx + 1 + width];
                this.ctx.fillStyle = isolinesColors[isobands[idx]];
                if(sum !== 0 && sum !== 4) this.ctx.fillRect(i, j, 1, 1);
            }
        }

        // Add X and Y axis
        this.ctx.fillStyle = this.colors[0];

        let labelsDist = 0.5;
        if(this.scale > 3.0) labelsDist = 1.0;

        for(let i = 0; i < centerX / this.scale; i += labelsDist){
            this.ctx.fillText(i.toFixed(1), centerX + i * this.scale, height - 22);
            if(i !== 0) this.ctx.fillText((-i).toFixed(1), centerX - i * this.scale, height - 22);
        }
        for(let i = 0; i < centerY / this.scale; i += labelsDist){
            this.ctx.fillText(i.toFixed(1), 10, centerY + i * this.scale);
            if(i !== 0) this.ctx.fillText((-i).toFixed(1), 10, centerY - i * this.scale);
        }

        // Init optimizers
        const start = this.func.getStartPoint();
        this.optims = [
            new SGD(start),
            new Momentum(start),
            new AdaGrad(start),
            new RMSProp(start),
            new Adam(start),
            new AdaMax(start),
            new AMSGrad(start)
        ];

        // Draw legend
        let textYOffset = 22;
        const textXOffset = 50;
        const lineHeight = 20;

        this.ctx.fillText(this.func.getName(), textXOffset, textYOffset)
        if(this.func.hasGlobalMin()) {
            textYOffset += lineHeight;
            const globalMin = this.func.getGlobalMin()
            this.ctx.fillText("Optimum: f(x*) = " + Math.round(this.func.val(globalMin) * 10000) / 10000 + ", at x* =  (" + globalMin[0] + ", " + globalMin[1] + ")", textXOffset, textYOffset);
            Utils.fillCircle(this.ctx, centerX + globalMin[0] * this.scale, centerY + -globalMin[1] * this.scale, 2, this.colors[0]);
        }

        textYOffset += lineHeight;
        this.ctx.fillText("Starting point: x0 = (" + start[0] + ", " + start[1] + ")", textXOffset, textYOffset);

        textYOffset += 2 * lineHeight;
        this.ctx.fillText("Optimizers:", textXOffset, textYOffset);

        for(let i = 0; i < this.optims.length; ++i){
            textYOffset += lineHeight;
            this.ctx.fillStyle = this.colorsAlt[i];
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText("    " + this.optims[i].getName(), textXOffset, textYOffset);
            Utils.fillCircle(this.ctx, textXOffset + 3, textYOffset - 4, 3, this.colorsAlt[i]);
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    getSettings() {
        return [{
            prop: "functionToOptimize",
            type: "select",
            values: this.funcNames,
            toCall: "resize",
        }];
    }
}

module.exports = GradientDescent;

},{"./animation":2,"./utils":18}],8:[function(require,module,exports){
'use strict';

// Require
// ---------------------------------------------------------------------------------------------------------------------

const Utils = require("./utils");

const ThreeNPlusOne = require("./3n+1");
const Cardioids = require("./cardioids");
const CircularWaves = require("./circular-waves");
const GameOfLife = require("./game-of-live");
const GameOfLifeIsometric = require("./game-of-live-isometric");
const GradientDescent = require("./gradient-descent");
const NeuralNetwork = require("./neural-network");
const ParticlesAndAttractors = require("./particles-and-attractors");
const ParticlesVortex = require("./particles-vortex");
const ParticlesWaves = require("./particles-waves");
const PerlinNoiseParticles = require("./perlin-noise-particles");
const Sorting = require("./sorting");
const SpinningShapes = require("./spinning-shapes");
const Spirograph = require("./spirograph")


// Globals
// ---------------------------------------------------------------------------------------------------------------------

const canvas = document.getElementById("background");
const container = document.getElementById("container");
var lastWidth = 0;
var lastHeight = 0;
var needResize = false;
var framesInterval = 0;
var then = 0;
var paused = false;

/*
const colors = [ // Old color palette
    "#1ABFB2",
    "#54ABA4",
    "#639598",
    "#678786",
    "#92ABA1",
    "#A5BFBC",
    "#C5D1D2",
]
 */

// const colors = [ // Green palette
//     "#349BA9",
//     "#41B8AD",
//     "#73D4AD",
//     "#AEEABF",
//     "#73D4AD",
//     "#41B8AD",
// ]

const colors = [ // UA palette
    "#0058B5",
    "#0070b5",
    "#0193c9",
    "#03b2d9",
    "#007fb5",
    "#03609a",
]

// const colorsAlt = [ // Alt palette
//     "#4E2463",
//     "#B53C6B",
//     "#E36D5D",
//     "#ECAA7D",
//     "#1D5C86",
//     "#2B3875",
//     "#362f73"
// ];

const colorsAlt = [ // Alt palette
    "#602180",
    "#b6245c",
    "#e14f3b",
    "#ec8c4d",
    "#fff202",
    "#99f32b",
    "#106aa6",
    "#283b93",
];


// Get elements controls
// ---------------------------------------------------------------------------------------------------------------------

const content = document.getElementById("content");
const elemBgShow = document.getElementById("background-show");
const elemBgName = document.getElementById("background-name");
const elemBgNext = document.getElementById("background-next");
const elemBgCode = document.getElementById("background-code");
const elemBgReset = document.getElementById("background-reset");
const elemBgPlayPause = document.getElementById("background-play-pause");
const elemBgSettings = document.getElementById("background-settings");
const elemBgSettingsControls = document.getElementById("background-settings-controls");
const elemBgSettingsClose = document.getElementById("background-settings-close");


// Create animation and init animation loop
// ---------------------------------------------------------------------------------------------------------------------

let animations = [
    ThreeNPlusOne,
    Cardioids,
    CircularWaves,
    GameOfLife,
    GameOfLifeIsometric,
    GradientDescent,
    NeuralNetwork,
    ParticlesAndAttractors,
    ParticlesVortex,
    ParticlesWaves,
    PerlinNoiseParticles,
    Sorting,
    SpinningShapes,
    Spirograph
];

Utils.randomShuffle(animations);

let animationId = 0;
let animation = new animations[animationId](canvas, colors, colorsAlt);

function updateAnimation(animation) {
    let fps = animation.getFPS();
    framesInterval = 1000 / fps;
    then = Date.now();
    elemBgName.innerHTML = animation.getName();
    elemBgCode.href = animation.getCodeUrl();
    updateSettings(animation.getSettings());
    animation.resize();
}

updateAnimation(animation);


function render() {
    if(paused) return;

    const now = Date.now(),
          timeElapsed = now - then;

    // Limit framerate
    requestAnimationFrame(render);
    if (timeElapsed < framesInterval) return;
    then = now;

    // Detect container size change
    const width  = Math.max(container.offsetWidth, window.innerWidth),
          height = Math.max(container.offsetHeight, window.innerHeight);
    if(width !== lastWidth || height !== lastHeight) needResize = true;
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

    // Limit framerate (alt. way)
    /*
    setTimeout(() => {
        requestAnimationFrame(render);
    }, framesInterval);
     */
}

render();


// Controls functions
// ---------------------------------------------------------------------------------------------------------------------

function play(){
    elemBgPlayPause.innerHTML = "<i class=\"fas fa-pause\"></i> pause";
    paused = false;
    then = Date.now();
    render();
}

function pause(){
    elemBgPlayPause.innerHTML = "<i class=\"fas fa-play\"></i> play";
    paused = true;
}

if(elemBgShow) {
    function hideBackground(){
        content.classList.remove("fade-out");
        content.classList.add("fade-in");
        canvas.classList.remove("show-from-10");
        //canvas.classList.remove("hue-change");
        canvas.classList.add("fade-to-10");
        elemBgShow.innerHTML = "<i class=\"fas fa-eye\"></i> show";
    }

    function showBackground(){
        content.classList.remove("fade-in");
        content.classList.add("fade-out");
        canvas.classList.remove("faded-10");
        canvas.classList.remove("fade-to-10");
        //canvas.classList.add("hue-change");
        canvas.classList.add("show-from-10");
        elemBgShow.innerHTML = "<i class=\"fas fa-eye-slash\"></i> hide";
    }

    elemBgShow.addEventListener("click", function () {
        if (content.classList.contains("fade-out")) hideBackground();
        else showBackground();
    });
}

if(elemBgNext) {
    elemBgNext.addEventListener("click", function () {
        animationId = (animationId + 1) % animations.length;
        animation = new animations[animationId](canvas, colors, colorsAlt);
        updateAnimation(animation);
        play();
    });
}

if(elemBgReset) {
    elemBgReset.addEventListener("click", function () {
        animation = new animations[animationId](canvas, colors, colorsAlt);
        updateAnimation(animation);
        play();
    });
}

if(elemBgPlayPause) {
    elemBgPlayPause.addEventListener("click", function () {
        if (paused === false) pause()
        else play();
    });
}

if(elemBgSettings && elemBgSettingsControls && elemBgSettingsClose) {
    function closeSettings(){
        elemBgSettingsControls.classList.remove("fade-in");
        elemBgSettingsControls.classList.add("fade-out");
    }

    function showSettings(){
        elemBgSettingsControls.classList.remove("fade-out");
        elemBgSettingsControls.classList.add("fade-in");
        elemBgSettingsControls.style.display = "block";
    }

    // Show/hide the background settings panel
    elemBgSettings.addEventListener("click", function () {
        if (elemBgSettingsControls.classList.contains("fade-in")) closeSettings();
        else showSettings();
    });

    elemBgSettingsClose.addEventListener("click", function () {
        closeSettings();
    });

    // Events for dragging the background settings panel
    elemBgSettingsControls.addEventListener('mousedown', function (e) {
        if(e.target !== e.currentTarget) return;
        e.target.classList.add('moving');
        e.target.clickAnchorX = e.clientX - parseInt(e.target.style.left);
        e.target.clickAnchorY = e.clientY - parseInt(e.target.style.top);
    });

    addEventListener('mousemove', function (e) {
        if(elemBgSettingsControls.classList.contains('moving')){
            elemBgSettingsControls.style.left = e.clientX - elemBgSettingsControls.clickAnchorX + 'px';
            elemBgSettingsControls.style.top = e.clientY - elemBgSettingsControls.clickAnchorY  + 'px';
        }
    });

    addEventListener('mouseup', function (e) {
        elemBgSettingsControls.classList.remove('moving');
    });
}

function updateSettings(settings){
    let elemBgSettingsList = document.getElementById("background-settings-controls-list");
    if(elemBgSettingsControls && elemBgSettingsList) {
        elemBgSettingsList.innerHTML = "";

        if(settings.length === 0)
            elemBgSettingsList.innerHTML = "There are no settings (yet) for this animation";

        // Create settings controls
        settings.forEach(function(setting, index) {
            const value = eval(`animation.${setting.prop}`),
                elemId = setting.prop.split(/(?=[A-Z])/).join('-').toLowerCase() + "-controls",
                name = setting.prop.split(/(?=[A-Z])/).join(' ').toLowerCase();

            let optionControls = '<div><span class="setting-name">' + name + ' = </span>'

            if(["int", "float", "bool"].includes(setting['type'])) {
                let inputType = "range";
                if(setting.type === "bool") inputType = "checkbox";

                optionControls += `<input type="${inputType}" class="setting-input"` +
                    ` name="${setting.prop}" id="${elemId}" value="${value}"`;

                if(["int", "float"].includes(setting.type)) {
                    if(setting.step) optionControls += ` step="${setting.step}"`;
                    else if(setting.type === "float") optionControls += ' step="0.01"';
                    else optionControls += ' step="1"';
                    optionControls += ` min="${setting["min"]}" max="${setting["max"]}"`;
                }

                if(setting.type === "bool" && value) optionControls += ' checked';
                optionControls += `>[<output class="setting-value">${value}</output>]`;
            }
            if(setting.type === 'select') {
                optionControls += `<select class="setting-select" name="${setting.prop}" id="${elemId}">`;
                for(let v of setting['values']) {
                    if(v === value) optionControls += `<option selected value="${v}">${v}</option>`;
                    else optionControls += `<option value="${v}">${v}</option>`;
                }
                optionControls += "</select>";
            }
            optionControls += "</div>";
            elemBgSettingsList.innerHTML += optionControls;
        });

        // Add events
        settings.forEach(function(setting, index) {
            const elemId = setting.prop.split(/(?=[A-Z])/).join('-').toLowerCase() + "-controls";
            let elem = document.getElementById(elemId);
            if(elem) {
                elem.addEventListener("input", function (e) {
                    console.log(setting, e.target.value);
                    if (e.target.type === "checkbox") {
                        if (e.target.nextElementSibling) e.target.nextElementSibling.value = e.target.checked;
                        eval(`animation.${setting.prop} = e.target.checked;`);
                    } else {
                        if (e.target.nextElementSibling) e.target.nextElementSibling.value = e.target.value;
                        let value = e.target.value;
                        if (setting.type === "int") value = parseInt(e.target.value);
                        else if (setting.type === "float") value = parseFloat(e.target.value);
                        eval(`animation.${setting.prop} = value;`);
                    }
                    if (setting.toCall) animation[setting.toCall]();
                    elemBgName.innerHTML = animation.getName();
                    play();
                });
            }
        });
    }
}

},{"./3n+1":1,"./cardioids":3,"./circular-waves":4,"./game-of-live":6,"./game-of-live-isometric":5,"./gradient-descent":7,"./neural-network":9,"./particles-and-attractors":11,"./particles-vortex":12,"./particles-waves":13,"./perlin-noise-particles":14,"./sorting":15,"./spinning-shapes":16,"./spirograph":17,"./utils":18}],9:[function(require,module,exports){
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

        // Calculate values based on weights
        if(this.network.length === 0) return;
        for (let n of this.network[0]) n.v = Utils.randomRange(-1, 1);
        for (let i = 1; i < this.nLayers; i++) {
            for (let n of this.network[i]) {
                n.v = 0;
                for (let j = 0; j < this.network[i - 1].length; ++j) {
                    n.v += this.network[i - 1][j].v * n.w[j];
                }
                if(i === this.nLayers - 1) n.nlv = 1 / (1 + Math.exp(-n.v)); // Sigmoid for last layer
                else n.nlv = Math.max(0, n.v); // ReLU
            }
        }
    }

    draw() {
        Utils.clear(this.ctx, this.bgColor);

        // Draw connections
        for (let i = 0; i < this.nLayers - 1; i++) {
            const l1 = this.network[i],
                  l2 = this.network[i + 1];
            for (let n1 of l1) {
                for (let n2 of l2) {
                    const v = Utils.clip(n1.v, 0, 1),
                          color = this.colors[this.colors.length - 1 - Math.floor(v * this.colors.length)];
                    this.ctx.globalAlpha = v;
                    Utils.drawLine(this.ctx, n1.x, n1.y, n2.x, n2.y, color, 1 + v);
                }
            }
        }

        // Draw nodes
        this.ctx.globalAlpha = 1.0;
        for (let i = 0; i < this.nLayers; ++i) {
            const l = this.network[i];
            for (let n of l) {
                const v = Utils.clip(n.nlv, 0, 1),
                      v2 = Utils.clip(n.nlv * 2, 0, 4),
                      color = this.colors[this.colors.length - 1 - Math.floor(v * this.colors.length)],
                      nSize = this.baseNodeSize + v2;
                Utils.fillCircle(this.ctx, n.x, n.y, nSize, color);
                this.ctx.font = '12px sans-serif';
                let text = `ReLU(${Utils.round(n.v, 2)}) = ${Utils.round(n.nlv, 2)}`;
                if(i === 0) text = `${Utils.round(n.v, 2)}`;
                else if(i === this.nLayers - 1) text = `Sigmoid(${Utils.round(n.v, 2)}) = ${Utils.round(n.nlv, 2)}`;
                this.ctx.fillText(text, n.x - text.length * 2.5, n.y - 3 * this.baseNodeSize);
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
                let n = {x: x, y: y, v: 0, nlv: 0, w: null};
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

},{"./animation":2,"./utils":18}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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
                 particlesSpeed = "random",
                 fadingSpeed = 0.03,
                 numAttractors = 5,
                 attractorsSystem = "random",
                 attractorsSpeed = "random",
                 drawAttractors = false,
                 scale = 1
    ) {
        super(canvas, colors, colorsAlt, "system of particles and attractors", "particles-and-attractors.js");
        this.particles = []
        this.numParticles = numParticles;
        this.particlesSpeed = this.assignAndCheckIfRandom(particlesSpeed, Utils.round(Utils.randomRange(5, 15)));
        this.fadingSpeed = fadingSpeed;

        this.drawAttractors = drawAttractors;
        this.numAttractors = numAttractors;

        this.attractorsSystems = ["orbits", "eights"]
        this.attractorsSystem = this.assignAndCheckIfRandom(attractorsSystem, Utils.randomChoice(this.attractorsSystems));
        this.attractorsSpeed = this.assignAndCheckIfRandom(attractorsSpeed, Utils.round(Utils.randomRange(0.05, 0.1) * Utils.randomChoice([-1, 1])));
        this.attractorsPosition = 0;
        this.startingPosition = Utils.randomRange(0, 10);

        this.scale = scale;

        this.setup();
    }

    setup(){
        this.particles = []
        for (let i = 0; i < this.numParticles; ++i)
            this.particles.push(Utils.rotateVec2d(Utils.createVec2d(Utils.randomRange(1, 100), 0), i));
    }

    update(elapsed){
        this.time += elapsed / 1000;
        ++this.frame;
        this.attractorsPosition += elapsed / 1000 * this.attractorsSpeed;
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);

        const p = this.startingPosition + this.attractorsPosition;

        let attractors = [];
        if(this.attractorsSystem === "orbits") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / (2 * (this.numAttractors - 1));
            for (let i = 0; i < this.numAttractors; ++i)
                attractors.push(Utils.rotateVec2d(Utils.createVec2d(i * s, 0), p * i));
        } else if (this.attractorsSystem === "eights") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / this.numAttractors;
            for (let i = 0; i < this.numAttractors; ++i)
                attractors.push(Utils.rotateVec2d(Utils.createVec2d(i * Math.sin(p * Math.PI / 2) * s, 0), p * i));
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
                Utils.fillCircle(this.ctx, a.x, a.y, 5, this.colorsAlt[2])

        this.ctx.resetTransform();
    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");
    }

    getSettings() {
        return [{
            prop: "numParticles",
            type: "int",
            min: 1000,
            max: 15000,
            toCall: "setup",
        }, {
            prop: "particlesSpeed",
            type: "float",
            min: 1,
            max: 20,
        }, {
            prop: "fadingSpeed",
            type: "float",
            step: 0.001,
            min: 0,
            max: 0.1,
        }, {
            prop: "attractorsSystem",
            type: "select",
            values: this.attractorsSystems
        }, {
            prop: "numAttractors",
            type: "int",
            min: 3,
            max: 7,
        }, {
            prop: "attractorsSpeed",
            type: "float",
            min: -0.2,
            max: 0.2,
        }, {
            prop: "drawAttractors",
            type: "bool",
        }, {
            prop: "scale",
            type: "float",
            min: 0.05,
            max: 1.95,
        }];
    }
}

module.exports = ParticlesAndAttractors;

},{"./animation":2,"./utils":18}],12:[function(require,module,exports){
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
                 rotationSpeedMax = 0.02,
                 scale = 1
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
        this.scale = scale;
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
        this.ctx.scale(this.scale, this.scale);

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

},{"./animation":2,"./noise":10,"./utils":18}],13:[function(require,module,exports){
/*
 * "Particles waves" animation.
 * The effect was achieved by modifying perlin-noise-particles.js.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class ParticlesStorm extends Animation {
    constructor(canvas, colors, colorsAlt, 
                particlePer100PixSq = 48, 
                noiseScale = 0.001,
                fadingSpeed = 0.02) {
        super(canvas, colors, colorsAlt, "particles waves", "particles-waves.js");

        this.particlePer100PixSq = particlePer100PixSq;
        this.noiseScale = noiseScale;
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));
        this.fadingSpeed = fadingSpeed;
        this.particles = [];
        
        this.width = 0;
        this.height = 0;
    }

    update(elapsed) {
        this.time += elapsed / 1000;
        ++this.frame;

        for(let p of this.particles){
            const theta = this.noise.perlin3(p.x * this.noiseScale * 2,
                p.y  *this.noiseScale * 3,
                this.frame * this.noiseScale * 3) * 2 * Math.PI;
            p.x += 2 * Math.tan(theta);
            p.y += 2 * Math.sin(theta);

            // Wrap particles
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width ) p.x = 0;
            if (p.y < 0 ) p.y = this.height;
            if (p.y > this.height) p.y =  0;
        }
    }

    draw() {
        this.fadeOut(this.fadingSpeed);
        for(let p of this.particles){
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 1, 1);
        }
    }

    resize() {
        Utils.clear(this.ctx, this.bgColor);
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        const newParticles = this.width / 100 * this.height / 100 * this.particlePer100PixSq;

        // Create new particles
        this.particles = [];
        for(let i = 0; i < newParticles; i++){
            const particleX = Math.random() * this.width,
                  particleY = Math.random() * this.height;
            this.particles.push({
                x: particleX,
                y: particleY,
                color: Utils.lerpColor(this.colorA, this.colorB, particleX / this.width)
            });
        }
    }

    getSettings() {
        return [{
            prop: "particlePer100PixSq",
            type: "int",
            min: 1,
            max: 250,
            toCall: "resize",
        }, {
            prop: "noiseScale",
            type: "float",
            step: 0.0001,
            min: 0,
            max: 0.01,
        }, {
            prop: "fadingSpeed",
            type: "float",
            step: 0.001,
            min: 0,
            max: 0.1,
        }];
    }
}

module.exports = ParticlesStorm;

},{"./animation":2,"./noise":10,"./utils":18}],14:[function(require,module,exports){
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
                particlesSpeed = 1,
                drawNoise = false,
                fadingSpeed = 0
    ) {
        super(canvas, colors, colorsAlt, "particles moving through Perlin noise", "perlin-noise-particles.js");
        this.particlePer100PixSq = particlePer100PixSq;
        this.noiseScale = noiseScale;
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));
        this.drawNoise = drawNoise;

        this.particlesSpeed = particlesSpeed;
        this.fadingSpeed = fadingSpeed;

        this.width = 0;
        this.height = 0;
        this.particles = [];
        this.imageData = null;
    }

    update(elapsed) {
        this.time += elapsed / 1000;
        ++this.frame;
        let updates = 1,
            particlesSpeed = this.particlesSpeed;
        while(particlesSpeed > 1.0){
            particlesSpeed /= 2;
            updates *= 2;
        }
        for (let p of this.particles) {
            p.prevX = p.x;
            p.prevY = p.y;
        }
        for(let i = 0; i < updates; ++i) {
            for (let p of this.particles) {
                const angle = this.noise.perlin2(p.x * this.noiseScale, p.y * this.noiseScale) * 2 * Math.PI / this.noiseScale;
                p.x += Math.cos(angle) * p.speed * particlesSpeed;
                p.y += Math.sin(angle) * p.speed * particlesSpeed;
            }
        }
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        for(let p of this.particles){
            // Utils.fillCircle(this.ctx, p.x, p.y, p.radius, p.color);
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
                color: Utils.randomChoice(this.colors)
            });
        }
    }

    resize() {
        Utils.clear(this.ctx, this.bgColor);
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

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

    getSettings() {
        return [{
            prop: "particlesSpeed",
            type: "float",
            min: 0.25,
            max: 32,
        }, {
            prop: "fadingSpeed",
            type: "float",
            step: 0.0001,
            min: 0,
            max: 0.01,
        }];
    }
}

module.exports = PerlinNoiseParticles;

},{"./animation":2,"./noise":10,"./utils":18}],15:[function(require,module,exports){
/*
 * Visualization of different sorting algorithms.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

// Simple class for managing animations
class AnimationQueue {
    constructor(){
        this.queue = [];
    }

    push(stepFunc){
        this.queue.push({step: stepFunc, time: 0});
    }

    step(elapsed){
        let finished = true;
        if(this.queue.length){
            let e = this.queue[0];
            e.time += elapsed;
            finished = e.step(e.time);
            if(finished) this.queue.shift();
        }
        return (finished && !this.queue.length)
    }
}

// Base class for a sorting algorithm
class SortingAlgorithm {
    constructor(arr, name){
        this.arr = arr;
        this.moves = []
        this.cmpCount = 0;
        this.name = name;
        this.sort();
    }

    getName(){
        return this.name;
    }

    comp(arr, a, b){
        if(a !== b) {
            ++this.cmpCount;
            this.moves.push(["cmp", arr[a], arr[b]]);
        }
        return arr[a].val - arr[b].val;
    }

    compVal(a, b){
        if(a !== b){
            ++this.cmpCount;
            this.moves.push(["cmp", a, b]);
        }
        return a.val - b.val;
    }

    swap(arr, a, b){
        this.moves.push(["swap", [arr[a], arr[b]], [arr[b], arr[a]]]);
        let temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
    }

    rearrange(arr, a, b){
        let elA = [],
            elB = [];
        for(let i = 0; i < a.length; ++i){
            elA.push(this.arr[a[i]]);
            elB.push(this.arr[b[i]]);
        }
        for(let i = 0; i < a.length; ++i) arr[a[i]] = elB[i];
        this.moves.push(["swap", elB, elA]);
    }

    sort(){}

    getMoves(){
        return this.moves;
    }
}

class BubbleSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "bubble sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; i++) {
            let sorted = true;
            for (let j = 0; j < n - 1 - i; j++) {
                if (this.comp(this.arr, j, j + 1) > 0){
                    this.swap(this.arr, j, j + 1);
                    sorted = false;
                }
            }
            if(sorted) break;
        }
    }
}

class SelectionSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "selection sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; i++) {
            let m = i;
            for (let j = i; j < n; j++) if (this.comp(this.arr, m, j) > 0) m = j;
            if (i !== m) this.swap(this.arr, i, m);
        }
    }
}

class InsertionSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "insertion sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 1; i < n; i++) {
            let j = i;
            while (j > 0 && this.comp(this.arr, j, j - 1) < 0) {
                this.swap(this.arr, j, j - 1);
                --j;
            }
        }
    }
}

class MergeSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "merge sort");
    }

    sort(){
        this.mergeSort(0, this.arr.length - 1);
    }

    mergeSort(l, r){
        if (l < r) {
            const m = Math.floor((l + r) / 2);
            this.mergeSort(l, m);
            this.mergeSort(m + 1, r);
            this.merge(l, m, r);
        }
    }

    merge(s, m, e) {
        let l = s,
            r = m + 1;
        if (this.comp(this.arr, m, r) <= 0) return; // If already sorted

        let newOrder = [],
            oldOrder = [];
        for(let i = l; i <= e; ++i) oldOrder.push(i);
        while (l <= m && r <= e) {
            if(this.comp(this.arr, l, r) < 0) newOrder.push(l++);
            else newOrder.push(r++);
        }
        while (l <= m) newOrder.push(l++);
        while (r <= e) newOrder.push(r++);
        this.rearrange(this.arr, oldOrder, newOrder)
    }
}

class QuickSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "quick sort");
    }

    sort(){
        this.quickSort(0, this.arr.length - 1);
    }

    quickSort(l, r){
        if (r - l >= 1) {
            const p = this.partition(l, r);
            if (l < p - 1) this.quickSort(l, p - 1);
            if (p < r) this.quickSort(p, r);
        }
    }

    partition(l, r) {
        const p = this.arr[Math.floor((r + l) / 2)];
        while (l <= r) {
            while(this.compVal(this.arr[l], p) < 0) l++;
            while(this.compVal(this.arr[r], p) > 0) r--;
            if (l <= r) this.swap(this.arr, l++, r--);
        }
        return l;
    }
}

class HeapSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "heap sort");
    }
}


class Sorting extends Animation {
    constructor (canvas, colors, colorsAlt,
                 sortingAlgorithm = "random",
                 numElements = 100,
                 elementPadding = 2,
                 cmpDuration = 0.25,
                 swapDuration = 0.25,
                 speed = 1,
                 showNumbers = false,
                 showStats = false
        ) {
        super(canvas, colors, colorsAlt, "Sorting algorithm visualization", "sorting.js");
        this.numElements = numElements;
        this.elementPadding = elementPadding;
        this.cmpDuration = cmpDuration;
        this.swapDuration = swapDuration;
        this.speed = speed;
        this.showStats = showStats;

        this.sortAlgoNames = ["selection sort", "bubble sort", "insertion sort", "quick sort", "merge sort"];
        this.sortAlgoClasses = [SelectionSort, BubbleSort, InsertionSort, QuickSort, MergeSort];
        this.sortingAlgorithm = this.assignAndCheckIfRandom(sortingAlgorithm, Utils.randomChoice(this.sortAlgoNames));
        this.cmpTotal = 0;
        this.cmpCount = 0;

        this.setup();
    }

    setup(){
        this.animQueue = new AnimationQueue();

        // Randomize elements
        this.elements = [];
        for(let i = 0; i < this.numElements; ++i){
            const val = Utils.randomRange(0, 1),
                  color = Utils.lerpColor(this.colors[0], this.colors[this.colors.length - 1], val);
            this.elements.push({val: val, pos: i, color: color, z: 0})
        }

        // Sort
        let sortAlgoCls = this.sortAlgoClasses[this.sortAlgoNames.indexOf(this.sortingAlgorithm)];
        let sortAlgo = new sortAlgoCls(this.elements);
        this.moves = sortAlgo.getMoves();
        this.name = sortAlgo.getName() + " algorithm visualization";

        this.cmpTotal = sortAlgo.cmpCount;
        this.cmpCount = 0;
    }

    update(elapsed){
        elapsed /= 1000;
        elapsed *= this.speed;
        this.time += elapsed;
        ++this.frame;

        if(this.animQueue.step(elapsed)){
            if(!this.moves.length) return;

            let s = this.moves[0];
            const colorEasing = (x) => x < 0.5 ? Utils.easeInOutCubic( 2 * x) : 1 - Utils.easeInOutCubic( 2 * x - 1),
                  posEasing = Utils.easeInOutSine;

            if(s[0] === "cmp") {
                ++this.cmpCount;
                let e1 = s[1], e2 = s[2];
                const color1 = e1.color,
                      color2 = e2.color,
                      colorSel = this.colorsAlt[3],
                      duration = this.cmpDuration;

                this.animQueue.push(function (time) {
                    const prog = Math.min(time, duration) / duration;
                    e1.color = Utils.lerpColor(color1, colorSel, colorEasing(prog));
                    e2.color = Utils.lerpColor(color2, colorSel, colorEasing(prog));
                    return time >= duration;
                });
            }

            if(s[0] === "swap") {
                let e1 = s[1], e2 = s[2];
                let pos1 = [],
                    pos2 = [],
                    color = [];
                const colorSel = this.colorsAlt[1],
                      z = this.frame,
                      duration = this.swapDuration * e1.length;

                for(let i = 0; i < e1.length; ++i){
                    pos1.push(e1[i].pos);
                    pos2.push(e2[i].pos);
                    color.push(e1[i].color);
                }

                this.animQueue.push(function (time) {
                    const prog = Math.min(time, duration) / duration;
                    for(let i = 0; i < e1.length; ++i) {
                        e1[i].z = z;
                        e1[i].color = Utils.lerpColor(color[i], colorSel, colorEasing(prog));
                        e1[i].pos = Utils.lerp(pos1[i], pos2[i], posEasing(prog));
                    }
                    return time >= duration;
                });
            }

            this.moves.shift();
        }
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        const elementMaxHeight = this.ctx.canvas.height,
              elementWidth = this.ctx.canvas.width / this.numElements;

        this.elements = this.elements.sort((e1, e2) => e1.z - e2.z)
        for(let e of this.elements){
            const x = e.pos * elementWidth + this.elementPadding / 2,
                  y = e.val * elementMaxHeight;
            this.ctx.fillStyle = e.color;
            this.ctx.fillRect(x, 0, elementWidth - this.elementPadding, y);
        }

        if(this.showStats){
            const lineHeight = 20;
            this.ctx.font = '12px sans-serif';
            this.ctx.fillStyle = this.colors[0];

            this.ctx.fillText(`Sorting algorithm: ${this.sortingAlgorithm}`, lineHeight, elementMaxHeight - 3 * lineHeight);
            this.ctx.fillText(`Number of elements: ${this.numElements}`, lineHeight, elementMaxHeight - 2 * lineHeight);
            this.ctx.fillText(`Number of element comparisons: ${this.cmpCount} / ${this.cmpTotal}`, lineHeight, elementMaxHeight - lineHeight);
        }
    }

    getSettings() {
        return [{
            prop: "sortingAlgorithm",
            type: "select",
            values: this.sortAlgoNames,
            toCall: "setup",
        }, {
            prop: "numElements",
            type: "int",
            min: 8,
            max: 256,
            toCall: "setup",
        }, {
            prop: "speed",
            type: "float",
            step: 0.25,
            min: 0.5,
            max: 8,
        }, {
            prop: "showStats",
            type: "bool"
        }];
    }
}

module.exports = Sorting;

},{"./animation":2,"./utils":18}],16:[function(require,module,exports){
/*
 * Shapes moving in a circle.
 * Based on: https://observablehq.com/@rreusser/instanced-webgl-circles
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class SpinningShapes extends Animation {
    constructor (canvas, colors, colorsAlt, 
                 shapes = 500, 
                 sides = 0,
                 rotateShapes = false,
                 scale = 1,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, "", "spinning-shapes.js");

        this.shapeSides = [0, 1, 2, 3, 4, 5, 6, 8];
        this.shapeNames = ["circles", "points", "lines", "triangles", "rectangles", "pentagons", "hexagons", "octagons"];
        this.sides = this.assignAndCheckIfRandom(sides, Utils.randomChoice(this.shapeSides));
        this.updateName();
        this.rotateShapes = rotateShapes;
        this.shapes = shapes;

        this.distBase = 0.6;
        this.distVar = 0.2;
        this.sizeBase = 0.2;
        this.sizeVar = 0.12;

        this.scale = scale;
        this.rainbowColors = rainbowColors;
    }

    updateName(){
        this.name = this.shapeNames[this.shapeSides.indexOf(this.sides)] + " moving in a circle";
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        const scale = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3 * this.scale;

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        for (let i = 0; i < this.shapes; ++i) {
            const theta = i / this.shapes * 2 * Math.PI,
                  distance = (this.distBase + this.distVar * Math.cos(theta * 6 + Math.cos(theta * 8 + this.time / 2))) * scale,
                  x = Math.cos(theta) * distance,
                  y = Math.sin(theta) * distance,
                  radius = (this.sizeBase + this.sizeVar * Math.cos(theta * 9 - this.time)) * scale;
            if(this.rainbowColors) this.ctx.strokeStyle = 'hsl(' + (Math.cos(theta * 9 - this.time) + 1) / 2 * 360 + ', 100%, 75%)';
            else this.ctx.strokeStyle = Utils.lerpColor(this.colorA, this.colorB,(Math.cos(theta * 9 - this.time) + 1) / 2); // New with smooth color transition
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            if(this.sides === 0) Utils.pathCircle(this.ctx, x, y, radius);
            if(this.sides === 1) Utils.pathCircle(this.ctx, x, y, 1);
            else Utils.pathPolygon(this.ctx, x, y, radius, this.sides, theta * this.rotateShapes);
            this.ctx.stroke();
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{
            prop: "sides",
            type: "int",
            min: 0,
            max: 8,
            toCall: "updateName"
        }, {
            prop: "shapes",
            type: "int",
            min: 0,
            max: 2500,
        }, {
            prop: "rotateShapes",
            type: "bool",
        }, {
            prop: "scale",
            type: "float",
            min: 0.05,
            max: 1.95,
            toCall: "resize",
        }, {
            prop: "rainbowColors",
            type: "bool",
        }];
    }
}

module.exports = SpinningShapes

},{"./animation":2,"./utils":18}],17:[function(require,module,exports){
/*
 * Spirograph created with 2-4 random gears.
 * See: https://en.wikipedia.org/wiki/Spirograph,
 * and: http://www.eddaardvark.co.uk/v2/spirograph/spirograph2.html (this site is amazing).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class Spirograph extends Animation {
    constructor (canvas, colors, colorsAlt, points = 2500, length = 2, gearCount = "random") {
        super(canvas, colors, colorsAlt, "spirograph", "spirograph.js");

        this.points = points;
        this.length = length;
        this.maxGears = 5;
        this.gearCount = this.assignAndCheckIfRandom(gearCount, Utils.randomInt(2, this.maxGears));
        this.gearNames = ["zero", "one", "two", "three", "four", "five"];
        this.updateName();
        this.gears = [];
        for (let i = 0; i < this.maxGears; ++i) {
            this.gears.push({
                radius: Utils.round(Utils.randomRange(0, 100), 2),
                rate: Utils.round(Utils.randomRange(-100, 100), 2),
                phase: i * 0.005
            });
        }
    }

    updateName(){
        this.name = "spirograph with " + this.gearNames[this.gearCount] + " random gears";
    }

    getXY(i, j, scale = 1){
        let x = 0, y = 0;

        for(let k = 0; k < this.gearCount; ++k){
            const g = this.gears[k];
            x += g.radius * scale * Math.cos(g.rate * (i + j * g.phase));
            y += g.radius * scale * Math.sin(g.rate * (i + j * g.phase));
        }

        return {x: x, y: y}
    }

    draw() {
        Utils.clear(this.ctx, this.bgColor);

        // Normalize size to fit the screen nicely
        let totalRadius = 0;
        for(let i = 0; i < this.gearCount; ++i) totalRadius += this.gears[i].radius;
        const scale = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 / totalRadius;

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        const length = Math.PI * this.length,
              incr = length / this.points;
        let start = this.getXY(0, this.time, scale);

        for (let i = 0; i <= length; i += incr) {
            let next = this.getXY(i, this.time, scale);
            const color = Utils.lerpColor(this.colorA, this.colorB, i / length);
            Utils.drawLine(this.ctx, start.x, start.y, next.x, next.y, color, 1);
            start = next;
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        let settings = [{
            prop: "points",
            type: "int",
            min: 100,
            max: 10000,
        }, {
            prop: "length",
            type: "float",
            step: 0.25,
            min: 1,
            max: 8,
        }, {
            prop: "gearCount",
            type: "int",
            min: 1,
            max: this.maxGears,
            toCall: "updateName"
        }];
        for(let i = 0; i < this.maxGears; ++i){
            settings = settings.concat([{
                prop: `gears[${i}].radius`,
                type: "float",
                step: 0.01,
                min: 0,
                max: 100,
            }, {
                prop: `gears[${i}].rate`,
                type: "float",
                step: 0.01,
                min: -100,
                max: 100,
            }, {
                prop: `gears[${i}].phase`,
                type: "float",
                step: 0.001,
                min: -0.1,
                max: 0.1,
            }]);
        }
        return settings;
    }
}

module.exports = Spirograph

},{"./animation":2,"./utils":18}],18:[function(require,module,exports){
module.exports = {

    // Randomization helpers
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.randomRange(min, max));
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

    randomShuffle(arr){
        for (let i = arr.length - 1; i > 0; --i) {
             const j = Math.floor(Math.random() * (i + 1)),
                   temp = arr[i];
             arr[i] = arr[j];
             arr[j] = temp;
        }
    },

    // Array/math helpers
    round(value, decimalPlace = 2){
        const shift = Math.pow(10, decimalPlace);
        return Math.round( value * shift) / shift;
    },

    addArrays(a, b){
        return a.map((e, i) => e + b[i]);
    },

    subArrays(a, b){
        return a.map((e, i) => e - b[i]);
    },

    mulArrays(a, b){
        return a.map((e, i) => e * b[i]);
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

    // Functions to linearly interpolate between v1 and v2
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

    lerpColorsPallet(colors, t) {
        const interval = 1.0 / (colors.length - 1),
              i = Math.floor(t / interval);
        return this.lerpColor(colors[i % colors.length], colors[(i + 1) % colors.length], (t - i * interval) / interval);
    },

    mirrorColorsPallet(colors){
        let newPallet = colors;
    },

    // Easing functions
    easeInSine(x){
        return 1 - Math.cos((x * Math.PI) / 2);
    },

    easeOutSine(x){
        return Math.sin((x * Math.PI) / 2);
    },

    easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    },

    easeInQuad(x){
        return x * x;
    },

    easeOutQuad(x){
        return 1 - (1 - x) * (1 - x);
    },

    easeInOutQuad(x){
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    },

    easeInCubic(x){
        return x * x * x;
    },

    easeOutCubic(x){
        return 1 - Math.pow(1 - x, 3);
    },

    easeInOutCubic(x){
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    },

    easeInQuart(x){
        return x * x * x * x;
    },
    
    easeOutQuart(x){
        return 1 - Math.pow(1 - x, 4);
    },

    easeInOutQuart(x){
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    },

    // Canvas helpers
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

    fillCircle(ctx, x, y, radius, color){
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
    },

    strokeCircle(ctx, x, y, radius, color){
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.stroke();
    },

    pathShape(ctx, points){
        if(points.length) {
            ctx.moveTo(points[0][0], points[0][1]);
            for(let i = 1; i < points.length; ++i) ctx.lineTo(points[i][0], points[i][1]);
        }
    },

    pathClosedShape(ctx, points){
        if(points.length) {
            this.pathShape(ctx, points);
            ctx.lineTo(points[0][0], points[0][1]);
        }
    },

    blendColor(ctx, color, alpha = 1.0, globalCompositeOperation = 'source-over'){
        ctx.save();
        ctx.globalCompositeOperation = globalCompositeOperation;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    },

    createVec2d(x, y){
        return {x: x, y: y};
    },

    rotateVec2d(vec, r){
        const cos = Math.cos(r), sin = Math.sin(r);
        return {x: vec.x * cos - vec.y * sin, y: vec.x * sin + vec.y * cos};
    },

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    createOffscreenCanvas(width, height){
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    },

    isStrictMode(){
        return ((eval("var __temp = null"), (typeof __temp === "undefined")) ? "strict":  "non-strict");
    },

    addMultipleEventListener(element, events, handler) {
        events.forEach(e => element.addEventListener(e, handler))
    }
};

},{}]},{},[8])