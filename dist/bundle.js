(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

const NAME = "3n + 1 (Collatz Conjecture) visualization",
      FILE = "3n+1.js",
      DESC = `
3n + 1 (Collatz Conjecture) visualization 
inspired by this Veritasium's [video](https://www.youtube.com/watch?v=094y1Z2wpJg).
You can also read about the conjecture on [Wikipedia](https://en.wikipedia.org/wiki/Collatz_conjecture).

Each tic Collatz sequence is generated for the next number.
Following the generated sequence from its end (1), 
for each number, the line is drawn from the point of the previous line's end.
The next line is drawn at the angle of the previous line, rotated by the angle 
that depends if the following number in the sequence is even or odd.

Coded with no external dependencies, using only canvas API.
`;


const Animation = require("./animation");
const Utils = require("./utils");

class ThreeNPlusOne extends Animation {
    constructor(canvas, colors, colorsAlt,
                length = 30,
                evenAngle = 8,
                oddAngle = -20,
                drawNumbers = false,
                scale = 1,
                showStats = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.length = length;
        this.evenAngle = evenAngle;
        this.oddAngle = oddAngle;
        this.scale = scale;
        this.drawNumbers = drawNumbers;
        this.showStats = false;
        
        this.seqences = [];
        this.max = 0;
    }

    generateNextSequence(){
        let n = this.seqences.length + 1,
            sequence = [n];
        while (n !== 1) {
            if (n % 2) n = 3 * n + 1;
            else n /= 2;
            if(n > this.max) this.max = n;
            sequence.push(n);
            if(n < this.seqences.length) this.seqences[n - 1] = null;
        }
        this.seqences.push(sequence);
    }

    update(elapsed){
        for (let i = 0; i < this.speed; ++i) this.generateNextSequence();
    }

    drawSequence(sequence) {
        if(sequence === null) return;

        let x = 0, y = 0,
            angle = 270 * Math.PI / 180;
        const color = this.colors[this.frame % this.colors.length];

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = color;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        for(let i = sequence.length - 2; i >= 0; --i){
            const val = sequence[i];
            if(val % 2) angle += this.oddAngleRad;
            else angle += this.evenAngleRad;

            if(this.drawNumbers){
                const sin = Math.cos(angle),
                      cos = Math.sin(angle);
                x += this.length / 2 * sin;
                y += this.length / 2 * cos;
                this.ctx.fillText(val, x + 10, y);
                x += this.length / 2 * sin;
                y += this.length / 2 * cos;
            } else {
                x += this.length * Math.cos(angle);
                y += this.length * Math.sin(angle);
            }
            this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
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

        if(this.showStats){
            this.resetFont();
            const lineHeight = 20;
            Utils.fillAndStrokeText(this.ctx, `Current starting number: ${this.seqences.length}`, lineHeight, this.ctx.canvas.height - 3 * lineHeight);
            Utils.fillAndStrokeText(this.ctx, `Highest reached number: ${this.max}`, lineHeight, this.ctx.canvas.height - 2 * lineHeight);
        }
    }

    resize() {
        this.frame = 0;
        this.clear();
    }

    restart(){
        this.seqences = [];
        super.restart();
    }

    getSettings() {
        return [{prop: "length", type: "int", min: 1, max: 100, toCall: "resize"},
                {prop: "evenAngle", type: "int", min: -45, max: 45, toCall: "resize"},
                {prop: "oddAngle", type: "int", min: -45, max: 45, toCall: "resize"},
                {prop: "speed", type: "int", min: 1, max: 16},
                {prop: "drawNumbers", type: "bool", toCall: "resize"},
                {prop: "scale", type: "float", min: 0.05, max: 1.95, toCall: "resize"},
                {prop: "showStats", type: "bool"}];
    }
}

module.exports = ThreeNPlusOne;

},{"./animation":3,"./utils":35}],2:[function(require,module,exports){
// Simple class for managing animations
class AnimationQueue {
    constructor(){
        this.queue = [];
    }

    push(stepFunc){
        this.queue.push({step: stepFunc, time: 0});
    }

    step(elapsed){
        let timeLeft = elapsed;
        while(this.queue.length && timeLeft > 0){
            let e = this.queue[0];
            e.time += elapsed;
            timeLeft = e.step(e.time);
            if(timeLeft >= 0) this.queue.shift();
        }
        return timeLeft;
    }

    clear(){
        this.queue = [];
    }
}

module.exports = AnimationQueue;
},{}],3:[function(require,module,exports){
'use strict';

/*
 * Base class for all the background animations.
 */

const Noise = require("./noise");
const Utils = require("./utils");

class Animation {
    constructor(canvas, colors, colorsAlt,
                name = "",
                file = "",
                description = "",
                seed = "random") {
        this.ctx = canvas.getContext("2d", { alpha: false });

        // Colors variables
        this.bgColor = "#FFFFFF";
        this.colors = colors;
        this.colorsAlt = colorsAlt;
        this.colorA = colors[0];
        this.colorB = colors[3];

        // Basic info
        this.name = name;
        this.file = file;
        this.description = description;

        // Time variables
        this.time = 0;
        this.frame = 0;
        this.speed = 1;
        this.fps = 30;

        // Noise, it is frequently used by many animations
        this.noise = Noise.noise;

        // Seed, might be combined with seedable rngs to make animations deterministic
        this.rand = null;
        this.maxSeedValue = 999999;
        this.seed = this.assignIfRandom(seed, Math.round(Math.random() * this.maxSeedValue));
        this.setSeed(this.seed);

        // Debug flag
        this.debug = false;
    }

    resetFont(){
        // Reset text settings
        this.ctx.font = '14px sans-serif';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";        
        this.ctx.fillStyle = this.colors[0];
        this.ctx.strokeStyle = this.bgColor;
    }

    setSeed(seed){
        this.noise.seed(seed / this.maxSeedValue);
        this.rand = Utils.Mulberry32(seed);
    }

    assignIfRandom(value, random){  // Commonly used by many constructors
        if(value === "random") return random;
        else return value;
    }

    clear(){  // Clear background
        Utils.clear(this.ctx, this.bgColor);
    }

    fadeOut(alpha) {  // Commonly used by some animations
        // Assumes that bgColor is white or other light color
        this.blendColorAlpha(this.bgColor, alpha, "lighter");
    }

    blendColorAlpha(color, alpha, mode) {  // More general version of the above
        if (alpha <= 0.0005 && this.frame % 20 === 0) Utils.blendColor(this.ctx, color, alpha * 20, mode);
        else if (alpha <= 0.001 && this.frame % 10 === 0) Utils.blendColor(this.ctx, color, alpha * 10, mode);
        else if (alpha <= 0.005 && this.frame % 2 === 0) Utils.blendColor(this.ctx, color, alpha * 2, mode);
        //else if(alpha > 0.005) Utils.blendColor(this.ctx, color, alpha, mode);
        else Utils.blendColor(this.ctx, color, alpha, mode);
    }

    getFPS(){
        return this.fps;
    }

    getName(){
        return this.name;
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/src/" + this.file;
    }

    getDescription(){
        return this.description;
    }

    update(elapsed){
        // By default just update timer and frame count
        this.time += elapsed / 1000 * this.speed;
        ++this.frame;
    }

    resize(){
        // By default do nothing
    }

    restart() {
        this.time = 0;
        this.frame = 0;
        this.setSeed(this.seed);
        this.resize();
    }

    getSettings() {
        return [] // By default there is no settings
    }

    getSeedSettings() {
        return {prop: "seed", type: "int", min: 0, max: this.maxSeedValue, toCall: "restart"};
    }

    mouseAction(cords) {
        // By default do nothing, this is not really implemented
    }
}

module.exports = Animation;

},{"./noise":19,"./utils":35}],4:[function(require,module,exports){
'use strict';

const NAME = "cardioids with a pencil of lines",
      FILE = "cardioids.js",
      DESC = `
Modified method of L. Cremona for drawing cardioid with a pencil of lines,
as described in section "cardioid as envelope of a pencil of lines" 
of this Wikipedia [article](https://en.wikipedia.org/wiki/Cardioid).

Here the shift of the second point for each line is determined by time passed
from the beginning of the animation.

To see what is really happening, try to set the number of lines to small number.

Playing with both number of lines and speed, allow to notice different interesting patterns.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class Cardioids extends Animation {
    constructor (canvas, colors, colorsAlt,
                 lines = 400,
                 scale = 1.0,
                 speed = 0.05,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.lines = lines;
        this.scale = scale;
        this.speed = speed;
        this.rainbowColors = rainbowColors;
        this.radius = 0;
    }

    getVec(i){
        const angle = Utils.remap(i, 0, this.lines, 0, 2 * Math.PI);
        return Utils.rotateVec2d(Utils.createVec2d(this.radius, 0), Math.PI + angle);
    }

    draw() {
        this.clear();

        this.radius = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3 * this.scale;
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        Utils.strokeCircle(this.ctx, 0, 0, this.radius, this.colors[0]);

        for (let i = 0; i <= this.lines; ++i) {
            const a = this.getVec(i),
                  b = this.getVec(i * this.time);
            let color;
            if(this.rainbowColors) color = 'hsl(' + i / this.lines * 360 + ', 100%, 75%)';
            else color = Utils.lerpColorsPallet([this.colorA, this.colorB, this.colorA], i / this.lines);
            this.ctx.strokeStyle = color;
            Utils.drawLine(this.ctx, a.x, a.y, b.x, b.y, 1, color);
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "lines", type: "int", min: 1, max: 2500},
                {prop: "speed", type: "float", min: -2.0, max: 2.0},
                {prop: "scale", type: "float", min: 0.25, max: 1.75},
                {prop: "rainbowColors", type: "bool"}];
    }
}

module.exports = Cardioids

},{"./animation":3,"./utils":35}],5:[function(require,module,exports){
'use strict';

const NAME = "circular waves",
      FILE = "circular-waves.js",
      DESC = `
This animation draw a circle as a set of vertices and edges,
noise is added to the position of each vertex to create a wave effect. 

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class CircularWaves extends Animation {
    constructor(canvas, colors, colorsAlt,
                vertices = 180,
                noiseScale = 0.5,
                radiusScaleMin = 0.4,
                radiusScaleMax = 1.2,
                fadingSpeed = 0.001,
                rainbowColors = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.vertices = vertices;
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

        const zoff = this.frame * 0.005,
              radPerVertex = 2 * Math.PI / this.vertices;
        if(this.rainbowColors) this.ctx.strokeStyle = 'hsl(' + Math.abs(Math.sin(zoff * 5)) * 360 + ', 100%, 50%)';
        else this.ctx.strokeStyle = Utils.lerpColor(this.colorA, this.colorB, Math.abs(Math.sin(zoff * 5)));

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        this.ctx.beginPath();
        for (let v = 0; v <= this.vertices; ++v) {
            const aRad = v * radPerVertex,
                  xoff = Math.cos(aRad) * this.noiseScale,
                  yoff = Math.sin(aRad) * this.noiseScale,
                  n = this.noise.simplex3(xoff, yoff, zoff),
                  r = Utils.remap(n, -1, 1, this.radiusMin, this.radiusMax),
                  x = r * Math.cos(aRad),
                  y = r * Math.sin(aRad);

            if(v === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        this.ctx.resetTransform();
    }

    resize() {
        this.radiusMin = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.radiusScaleMin;
        this.radiusMax = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 2 * this.radiusScaleMax;
        if(this.radiusMin > this.radiusMax) [this.radiusMin, this.radiusMax] = [this.radiusMax, this.radiusMin];
        this.clear();
    }

    getSettings() {
        return [{prop: "vertices", type: "int", min: 3, max: 720, toCall: "resize"},
                {prop: "radiusScaleMin", type: "float", min: 0, max: 2.0, toCall: "resize"},
                {prop: "radiusScaleMax", type: "float", min: 0, max: 2.0, toCall: "resize"},
                {prop: "noiseScale", type: "float", min: 0, max: 2.0, toCall: "resize"},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.1},
                {prop: "rainbowColors", type: "bool"},
                this.getSeedSettings()];
    }
}

module.exports = CircularWaves;

},{"./animation":3,"./utils":35}],6:[function(require,module,exports){
'use strict';

const NAME = "Code writing animation",
      FILE = "codding.js",
      DESC = `
Work in progress.

Code writing animation inspired by: https://openprocessing.org/sketch/1219550
It's only light themed to match website colors, personally I always use dark IDE.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class Coding extends Animation {
    constructor(canvas, colors, colorsAlt,
                charSize = 20,
                tabSize = 4) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.charSize = charSize;
        this.lineX = this.padding;
        this.lineY = this.padding;

        this.tabSize = tabSize;
        this.maxLines = 0;
        this.line = 0;
        this.tabs = 0;
        this.words = 0;
        this.wordLen = 0;

        this.editorTheme = { // Loosely based on Monokai Light theme
            keyword: "#33C5E1",
            typeName: "#F52D73",
            argument: "#F9A857",
            variable: "#030303",
            numericValue: "#B693FB",
            stringValue: "#F0763B",
            comment: "#737373",
        }

        this.firstWordColors = [this.editorTheme.keyword,
                                this.editorTheme.typeName,
                                this.editorTheme.variable,
                                this.editorTheme.comment];
        this.afterTypeName = [this.editorTheme.argument,
                              this.editorTheme.typeName,
                              this.editorTheme.variable];
        this.afterVariable = Utils.getValues(this.editorTheme);
        this.otherCases = [this.editorTheme.keyword,
                           this.editorTheme.typeName,
                           this.editorTheme.variable,
                           this.editorTheme.comment,
                           this.editorTheme.numericValue,
                           this.editorTheme.stringValue];

        this.currentColor = null;
        this.imageData = null;

        this.updateCharSize();
        this.newLine();
        this.newWord();
    }

    updateCharSize(){
        this.padding = this.charSize / 2;
        this.lineHeight = this.charSize * 1.25;
        this.charWidth = Math.ceil(this.charSize / 1.618);
        this.charHeight = this.charSize;
        this.imageData = null;
        this.line = 0;
        this.resize();
        this.newWord();
    }

    newWord(){
        // Some handcrafted rules for the next word's color to make it look more structured
        this.wordLen = 0;
        if(this.words === 0) this.currentColor = Utils.randomChoice(this.firstWordColors);
        else {
            if (this.currentColor === this.editorTheme.typeName)
                this.currentColor = Utils.randomChoice(this.afterTypeName);
            else if (this.currentColor === this.editorTheme.variable)
                this.currentColor = Utils.randomChoice(this.afterVariable);
            else if (this.currentColor === this.editorTheme.comment)
                this.currentColor = this.editorTheme.comment;
            else this.currentColor = Utils.randomChoice(this.otherCases);
        }
    }

    newLine(){
        if(this.line > this.maxLines){
            const shift = (this.maxLines - this.line) * this.lineHeight;
            this.clear();
            if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, shift);
            this.line = this.maxLines;
        }

        this.words = 0;
        this.lineX = this.padding + this.tabs * this.tabSize * this.charWidth;
        this.lineY = this.padding + this.line * this.lineHeight;
    }

    draw() {
        // Continue current word and write next "character"
        if(this.rand() < Math.pow(0.9, this.wordLen - 2) || this.wordLen < 3){
            this.lineX += this.charWidth;
            ++this.wordLen;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.fillRect(this.lineX, this.lineY, this.charWidth, this.charHeight);
        } else {
            if(this.rand() < Math.pow(0.5,this.words - 1) || this.words < 2) { // Continue line
                ++this.words;
                this.lineX += this.charWidth;
            } else { // New line
                const indentChoice = Utils.randomChoice(["inc", "inc", "dec", "dec", "keep", "keep", "reset", "keep+newline"]);
                if(indentChoice === "inc" && this.tabs < 4) ++this.tabs;
                else if(indentChoice === "keep+newline") ++this.line;
                else if(indentChoice === "dec" && this.tabs > 0) {
                    ++this.line;
                    --this.tabs;
                } else if(indentChoice === "reset" && this.tabs > 0){
                    ++this.line;
                    this.tabs = 0;
                }
                ++this.line;
                this.newLine();
            }
            this.newWord();
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize() {
        this.clear();
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);
        this.maxLines = Math.floor((this.ctx.canvas.height - 2 * this.padding) / this.lineHeight) - 1;
        this.newLine();
    }

    getSettings() {
        return [{prop: "charSize", type: "int", min: 8, max: 72, toCall: "updateCharSize"},
                {prop: "tabSize", type: "int", min: 1, max: 16}]
    }
}

module.exports = Coding;

},{"./animation":3,"./utils":35}],7:[function(require,module,exports){
'use strict';

/*
 * This is just a quick little implementation of Delaunay Triangulation in JavaScript.
 * It was mostly ported from Paul Bourke's C implementation,
 * but I referenced some bits from another JavaScript implementation
 * and rewrote a bunch of things in ways more amenable to fast JavaScript execution.
 *
 * Source: https://github.com/darkskyapp/delaunay-fast
 */

var Delaunay;

(function() {
    "use strict";

    var EPSILON = 1.0 / 1048576.0;

    function supertriangle(vertices) {
        var xmin = Number.POSITIVE_INFINITY,
            ymin = Number.POSITIVE_INFINITY,
            xmax = Number.NEGATIVE_INFINITY,
            ymax = Number.NEGATIVE_INFINITY,
            i, dx, dy, dmax, xmid, ymid;

        for(i = vertices.length; i--; ) {
            if(vertices[i][0] < xmin) xmin = vertices[i][0];
            if(vertices[i][0] > xmax) xmax = vertices[i][0];
            if(vertices[i][1] < ymin) ymin = vertices[i][1];
            if(vertices[i][1] > ymax) ymax = vertices[i][1];
        }

        dx = xmax - xmin;
        dy = ymax - ymin;
        dmax = Math.max(dx, dy);
        xmid = xmin + dx * 0.5;
        ymid = ymin + dy * 0.5;

        return [
            [xmid - 20 * dmax, ymid -      dmax],
            [xmid            , ymid + 20 * dmax],
            [xmid + 20 * dmax, ymid -      dmax]
        ];
    }

    function circumcircle(vertices, i, j, k) {
        var x1 = vertices[i][0],
            y1 = vertices[i][1],
            x2 = vertices[j][0],
            y2 = vertices[j][1],
            x3 = vertices[k][0],
            y3 = vertices[k][1],
            fabsy1y2 = Math.abs(y1 - y2),
            fabsy2y3 = Math.abs(y2 - y3),
            xc, yc, m1, m2, mx1, mx2, my1, my2, dx, dy;

        /* Check for coincident points */
        if(fabsy1y2 < EPSILON && fabsy2y3 < EPSILON)
            throw new Error("Eek! Coincident points!");

        if(fabsy1y2 < EPSILON) {
            m2  = -((x3 - x2) / (y3 - y2));
            mx2 = (x2 + x3) / 2.0;
            my2 = (y2 + y3) / 2.0;
            xc  = (x2 + x1) / 2.0;
            yc  = m2 * (xc - mx2) + my2;
        }

        else if(fabsy2y3 < EPSILON) {
            m1  = -((x2 - x1) / (y2 - y1));
            mx1 = (x1 + x2) / 2.0;
            my1 = (y1 + y2) / 2.0;
            xc  = (x3 + x2) / 2.0;
            yc  = m1 * (xc - mx1) + my1;
        }

        else {
            m1  = -((x2 - x1) / (y2 - y1));
            m2  = -((x3 - x2) / (y3 - y2));
            mx1 = (x1 + x2) / 2.0;
            mx2 = (x2 + x3) / 2.0;
            my1 = (y1 + y2) / 2.0;
            my2 = (y2 + y3) / 2.0;
            xc  = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
            yc  = (fabsy1y2 > fabsy2y3) ?
                m1 * (xc - mx1) + my1 :
                m2 * (xc - mx2) + my2;
        }

        dx = x2 - xc;
        dy = y2 - yc;
        return {i: i, j: j, k: k, x: xc, y: yc, r: dx * dx + dy * dy};
    }

    function dedup(edges) {
        var i, j, a, b, m, n;

        for(j = edges.length; j; ) {
            b = edges[--j];
            a = edges[--j];

            for(i = j; i; ) {
                n = edges[--i];
                m = edges[--i];

                if((a === m && b === n) || (a === n && b === m)) {
                    edges.splice(j, 2);
                    edges.splice(i, 2);
                    break;
                }
            }
        }
    }

    Delaunay = {
        triangulate: function(vertices, key) {
            var n = vertices.length,
                i, j, indices, st, open, closed, edges, dx, dy, a, b, c;

            /* Bail if there aren't enough vertices to form any triangles. */
            if(n < 3)
                return [];

            /* Slice out the actual vertices from the passed objects. (Duplicate the
             * array even if we don't, though, since we need to make a supertriangle
             * later on!) */
            vertices = vertices.slice(0);

            if(key)
                for(i = n; i--; )
                    vertices[i] = vertices[i][key];

            /* Make an array of indices into the vertex array, sorted by the
             * vertices' x-position. Force stable sorting by comparing indices if
             * the x-positions are equal. */
            indices = new Array(n);

            for(i = n; i--; )
                indices[i] = i;

            indices.sort(function(i, j) {
                var diff = vertices[j][0] - vertices[i][0];
                return diff !== 0 ? diff : i - j;
            });

            /* Next, find the vertices of the supertriangle (which contains all other
             * triangles), and append them onto the end of a (copy of) the vertex
             * array. */
            st = supertriangle(vertices);
            vertices.push(st[0], st[1], st[2]);

            /* Initialize the open list (containing the supertriangle and nothing
             * else) and the closed list (which is empty since we havn't processed
             * any triangles yet). */
            open   = [circumcircle(vertices, n + 0, n + 1, n + 2)];
            closed = [];
            edges  = [];

            /* Incrementally add each vertex to the mesh. */
            for(i = indices.length; i--; edges.length = 0) {
                c = indices[i];

                /* For each open triangle, check to see if the current point is
                 * inside it's circumcircle. If it is, remove the triangle and add
                 * it's edges to an edge list. */
                for(j = open.length; j--; ) {
                    /* If this point is to the right of this triangle's circumcircle,
                     * then this triangle should never get checked again. Remove it
                     * from the open list, add it to the closed list, and skip. */
                    dx = vertices[c][0] - open[j].x;
                    if(dx > 0.0 && dx * dx > open[j].r) {
                        closed.push(open[j]);
                        open.splice(j, 1);
                        continue;
                    }

                    /* If we're outside the circumcircle, skip this triangle. */
                    dy = vertices[c][1] - open[j].y;
                    if(dx * dx + dy * dy - open[j].r > EPSILON)
                        continue;

                    /* Remove the triangle and add it's edges to the edge list. */
                    edges.push(
                        open[j].i, open[j].j,
                        open[j].j, open[j].k,
                        open[j].k, open[j].i
                    );
                    open.splice(j, 1);
                }

                /* Remove any doubled edges. */
                dedup(edges);

                /* Add a new triangle for each edge. */
                for(j = edges.length; j; ) {
                    b = edges[--j];
                    a = edges[--j];
                    open.push(circumcircle(vertices, a, b, c));
                }
            }

            /* Copy any remaining open triangles to the closed list, and then
             * remove any triangles that share a vertex with the supertriangle,
             * building a list of triplets that represent triangles. */
            for(i = open.length; i--; )
                closed.push(open[i]);
            open.length = 0;

            for(i = closed.length; i--; )
                if(closed[i].i < n && closed[i].j < n && closed[i].k < n)
                    open.push(closed[i].i, closed[i].j, closed[i].k);

            /* Yay, we're done! */
            return open;
        },
        contains: function(tri, p) {
            /* Bounding box test first, for quick rejections. */
            if((p[0] < tri[0][0] && p[0] < tri[1][0] && p[0] < tri[2][0]) ||
                (p[0] > tri[0][0] && p[0] > tri[1][0] && p[0] > tri[2][0]) ||
                (p[1] < tri[0][1] && p[1] < tri[1][1] && p[1] < tri[2][1]) ||
                (p[1] > tri[0][1] && p[1] > tri[1][1] && p[1] > tri[2][1]))
                return null;

            var a = tri[1][0] - tri[0][0],
                b = tri[2][0] - tri[0][0],
                c = tri[1][1] - tri[0][1],
                d = tri[2][1] - tri[0][1],
                i = a * d - b * c;

            /* Degenerate tri. */
            if(i === 0.0)
                return null;

            var u = (d * (p[0] - tri[0][0]) - b * (p[1] - tri[0][1])) / i,
                v = (a * (p[1] - tri[0][1]) - c * (p[0] - tri[0][0])) / i;

            /* If we're outside the tri, fail. */
            if(u < 0.0 || v < 0.0 || (u + v) > 1.0)
                return null;

            return [u, v];
        }
    };

    if(typeof module !== "undefined")
        module.exports = Delaunay;
})();
},{}],8:[function(require,module,exports){
'use strict';

const NAME = "figures spiral",
      FILE = "figures-spiral.js",
      DESC = `
Very simple of figures spinning in the spiral.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class FiguresSpiral extends Animation {
    constructor(canvas, colors, colorsAlt,
                number = 500,
                size = 50,
                sides = "random") {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.shapeSides = [0, 1, 2, 3, 4, 5, 6, 8];
        this.shapeNames = ["circles", "points", "lines", "triangles", "rectangles", "pentagons", "hexagons", "octagons"];
        this.sides = this.assignIfRandom(sides, Utils.randomChoice(this.shapeSides));
        this.updateName();
        this.size = size;
        this.number = number;
    }

    updateName(){
        this.name = this.shapeNames[this.shapeSides.indexOf(this.sides)] + " spinning in spiral";
    }

    draw() {
        this.clear();
        this.ctx.translate(this.ctx.canvas.width / 2,  this.ctx.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.colors[0];

        for (let i = 0; i < this.number; ++i) {
            this.ctx.rotate(Math.PI * (this.time * 0.001 + i * 0.000001));
            this.ctx.beginPath();
            if (this.sides === 0) Utils.pathCircle(this.ctx, i, i, this.size);
            if (this.sides === 1) Utils.pathCircle(this.ctx, i, i, 1);
            else Utils.pathPolygon(this.ctx, i, i, this.size, this.sides, 0);
            this.ctx.stroke();
        }
        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "sides", type: "int", min: 0, max: 8, toCall: "updateName"},
                {prop: "number", type: "int", min: 1, max: 1024},
                {prop: "size", type: "int", min: 1, max: 128},
                {prop: "speed", type: "float", step: 0.1, min: -4, max: 4}];
    }
}

module.exports = FiguresSpiral;

},{"./animation":3,"./utils":35}],9:[function(require,module,exports){
'use strict';

const NAME = "isometric Conway's game of life",
      FILE = "game-of-life-isometric.js",
      DESC = `
Conway's game of life visualization with isometric rendering.
You can read about the game of life on
[Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life).
Game of life is one of the first programs I wrote in my life.

As in the top-down version, cells leave 
a trace for a few steps after they die to achieve a nice effect.
Especially, cells that died in the previous step keep the appearance 
of the life cell resulting in a stable image 
since flickering is not that good for a background image.

Coded with no external dependencies, using only canvas API.
`;

const GameOfLife = require("./game-of-life");
const Utils = require("./utils");

class GameOfLifeIsometric extends GameOfLife {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 14,
                 cellBasePadding = 0,
                 spawnProb = 0.5,
                 fadeDeadCells = true,
                 drawCellsGrid = true,
                 loopGrid = true,
                 gridSize=1) {
        super(canvas, colors, colorsAlt, cellSize, cellBasePadding, spawnProb, loopGrid);

        this.name = NAME;
        this.file = FILE;
        this.description = DESC;
        this.fadeDeadCells = fadeDeadCells;
        this.drawCellsGrid = drawCellsGrid;

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
            Utils.drawLine(ctx, x, y, x + eastX, y + eastY, 1, color);
            Utils.drawLine(ctx, -x, y, -x + westX, y + westY, 1, color);
        }

        // Draw outline
        Utils.drawLine(ctx, 0, 0, eastX, eastY, 3, color);
        Utils.drawLine(ctx, 0, 0, westX, westY, 3, color);
        Utils.drawLine(ctx, westX, westY, southX, southY, 3, color);
        Utils.drawLine(ctx, eastX, eastY, southX, southY, 3, color);
    }

    drawPrerenderedCube(x, y, idx){
        const isoX = x * this.xShift - y * this.xShift,
              isoY = (x + y + 1) * this.yShift;

        this.ctx.drawImage(this.renderedCubes[idx], isoX - 1 * this.xShift, isoY - 3 * this.yShift);
    }

    draw() {
        this.clear();

        // Draw grid
        if(this.drawCellsGrid) {
            if (!this.renderedGrid) {
                let offCtx = Utils.createOffscreenCanvas(this.ctx.canvas.width, this.ctx.canvas.height).getContext('2d');
                offCtx.translate(this.ctx.canvas.width / 2, 1 / 8 * this.ctx.canvas.height);
                this.drawGrid(offCtx, 0, 0);
                this.renderedGrid = offCtx.canvas;
            }
            this.ctx.drawImage(this.renderedGrid, 0, 0);
        }

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
        return [{prop: "loopGrid", type: "bool"},
                {prop: "fadeDeadCells", type: "bool"},
                {prop: "drawCellsGrid", type: "bool"},
                {prop: "spawnProb", type: "float", step: 0.01, min: 0, max: 1, toCall: "restart"},
                this.getSeedSettings()];
    }
}

module.exports = GameOfLifeIsometric;

},{"./game-of-life":10,"./utils":35}],10:[function(require,module,exports){
'use strict';

const NAME = "Conway's game of life",
      FILE = "game-of-life.js",
      DESC = `
Conway's game of life visualization. 
You can read about the game of life on
[Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life).
Game of life is one of the first programs I wrote in my life.

In this version, cells leave a trace for 
a few steps after they die to achieve a nice effect.
Especially, cells that died in the previous step keep the appearance 
of the life cell resulting in a stable image 
since flickering is not that good for a background image.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");
const Utils = require("./utils");

class GameOfLife extends Grid {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 12,
                 cellPadding = 1,
                 spawnProb = 0.5,
                 loopGrid = true,
                 cellStyle = "random",
                 deadCellsFadingSteps = 5) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        
        this.cellSize = cellSize;
        this.cellBasePadding = cellPadding;
        this.spawnProb = spawnProb;
        this.cellStyles = ["square", "circle"];
        this.cellStyle = this.assignIfRandom(cellStyle, Utils.randomChoice(this.cellStyles));
        this.deadCellsFadingSteps = deadCellsFadingSteps;
        this.loopGrid = loopGrid;
    }

    isAlive(x, y) {
        if(!this.loopGrid) {
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return 0;
            else return (this.getVal(x, y) >= 1) ? 1 : 0;
        }
        else return (this.getVal(x % this.gridWidth, y % this.gridHeight) >= 1) ? 1 : 0;
    }

    update(elapsed){
        super.update(elapsed);
        
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
                if (numAlive === 2 && this.grid[cellIdx] >= 1) this.gridNext[cellIdx] = this.grid[cellIdx] + 1;
                else if (numAlive === 3) this.gridNext[cellIdx] = Math.max(1, this.grid[cellIdx] + 1);
                else this.gridNext[cellIdx] = Math.min(0, this.grid[cellIdx] - 1);
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid]
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
        this.clear();

        this.ctx.translate(
            -(this.mapWidth * this.cellSize - this.ctx.canvas.width) / 2, 
            -(this.mapHeight * this.cellSize - this.ctx.canvas.height) / 2
        );

        if(this.cellStyle === "square") this.drawCell = this.drawSquareCell;
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

        this.ctx.resetTransform();
    }

    newCellState(x, y) {
        return (this.rand() < this.spawnProb) ? 1 : -99999;
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{prop: "loopGrid", type: "bool"},
                {prop: "cellSize", type: "int", min: 4, max: 32, toCall: "restart"},
                {prop: "cellStyle", type: "select", values: this.cellStyles},
                {prop: "deadCellsFadingSteps", type: "int", min: 0, max: 8},
                {prop: "spawnProb", type: "float", step: 0.01, min: 0, max: 1, toCall: "restart"},
                this.getSeedSettings()];
    }

    mouseAction(cords) {
        // const x = Math.floor(cords.x / this.cellSize),
        //       y = Math.floor(cords.y / this.cellSize),
        //       cellCord = x + y * this.gridWidth;
        // this.grid[cellCord] = 1;
        // this.draw();
    }
}

module.exports = GameOfLife;

},{"./grid":13,"./utils":35}],11:[function(require,module,exports){
'use strict';

const NAME = "Glitch animation",
      FILE = "glitch.js",
      DESC = `
The animation is just cellular automata that apply to the cell 
a state of one of the neighbor cells based on a noise function.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");

class Glitch extends Grid {
    constructor(canvas, colors, colorsAlt,
                cellSize = 7,
                noiseScale = 0.0051) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.noiseScale = noiseScale;
    }

    update(elapsed){
        super.update(elapsed);

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const r = this.noise.simplex3(x * this.noiseScale, y * this.noiseScale, this.frame * this.noiseScale);
                const sw = Math.round(20 * r) % 5;
                const cellIdx = this.getIdx(x, y);
                switch (sw) {
                    case 0:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x - 1, y)]; // west
                        break
                    case 1:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x + 1, y)]; // east
                        break
                    case 2:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x, y - 1)]; // north
                        break
                    case 3:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x, y + 1)]; // south
                        break
                    case 4:
                        this.gridNext[cellIdx] = this.grid[cellIdx]; // self
                }
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid];
    }

    draw() {
        this.clear();
        this.ctx.fillStyle = this.colors[0];
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                if(this.grid[this.getIdx(x, y)] > 0) this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }

    newCellState(x, y) {
        return (x + y) % 2 ? 1 : 0;
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 12, toCall: "resize"},
                {prop: "noiseScale", type: "float", step: 0.0001, min: 0.001, max: 0.05},
                this.getSeedSettings()];
    }
}

module.exports = Glitch;

},{"./grid":13}],12:[function(require,module,exports){
'use strict';

const NAME = "visualization of gradient descent algorithms",
      FILE = "gradient-descent.js",
      DESC = `
Visualization of gradient descent-based optimizers.

Coded with no external dependencies, using only canvas API.
`;


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
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.funcNames = ["with saddle point", "Beale", "Styblinski-Tang"];
        this.functionToOptimize = this.assignIfRandom(functionToOptimize, Utils.randomChoice(this.funcNames));
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
            Utils.drawLine(this.ctx, x1 * this.scale, -y1 * this.scale, x2 * this.scale, -y2 * this.scale, 2, this.colorsAlt[i]);
        }

        this.ctx.resetTransform();

        if (this.frame >= this.func.getSteps()) this.resize();
    }
    
    // TODO: refactor
    resize() {
        this.clear();
        
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
            this.ctx.fillText((-i).toFixed(1), 10, centerY + i * this.scale);
            if(i !== 0) this.ctx.fillText((i).toFixed(1), 10, centerY - i * this.scale);
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

        this.ctx.font = '14px sans-serif';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = this.colors[0];
        this.ctx.strokeStyle = this.bgColor;

        this.ctx.fillText(this.func.getName(), textXOffset, textYOffset)
        if(this.func.hasGlobalMin()) {
            textYOffset += lineHeight;
            const globalMin = this.func.getGlobalMin()
            Utils.fillAndStrokeText(this.ctx, `Optimum: f(x*) = ${Math.round(this.func.val(globalMin) * 10000) / 10000}, at x* =  (${globalMin[0]}, ${globalMin[1]})`, textXOffset, textYOffset, 2);
            Utils.fillCircle(this.ctx, centerX + globalMin[0] * this.scale, centerY + -globalMin[1] * this.scale, 2, this.colors[0]);
        }

        textYOffset += lineHeight;
        Utils.fillAndStrokeText(this.ctx, `Starting point: x0 = (${start[0]}, ${start[1]})`, textXOffset, textYOffset);

        textYOffset += 2 * lineHeight;
        Utils.fillAndStrokeText(this.ctx, "Optimizers:", textXOffset, textYOffset);

        for(let i = 0; i < this.optims.length; ++i){
            textYOffset += lineHeight;
            this.ctx.fillStyle = this.colorsAlt[i];
            Utils.fillAndStrokeText(this.ctx, `${this.optims[i].getName()}`, textXOffset + 20, textYOffset);
            Utils.fillCircle(this.ctx, textXOffset + 3, textYOffset - 4, 3, this.colorsAlt[i]);
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    getSettings() {
        return [{prop: "functionToOptimize", type: "select", values: this.funcNames, toCall: "resize"}];
    }
}

module.exports = GradientDescent;

},{"./animation":3,"./utils":35}],13:[function(require,module,exports){
'use strict';

/*
 * Base class for all animations based on grid of cells.
 */

const Animation = require("./animation");

class Grid extends Animation {
    constructor(canvas, colors, colorsAlt, 
                name = "",
                file = "",
                description = "",
                seed = "random") {
        super(canvas, colors, colorsAlt, name, file, description, seed);

        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = null;
        this.gridNext = null;
    }

    getIdx(x, y) {
        return x + y * this.gridWidth;
    }

    getIdxWrap(x, y) {
        return (x + this.gridWidth) % this.gridWidth + (y + this.gridHeight) % this.gridHeight * this.gridWidth;
    }

    getVal(x, y) {
        return this.grid[this.getIdx(x, y)];
    }

    getValWrap(x, y) {
        return this.grid[this.getIdxWrap(x, y)];
    }

    newCellState(x, y) {
        return 0;
    }

    resizeGrid(newGridWidth, newGridHeight){
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; ++y) {
            for (let x = 0; x < newGridWidth; ++x) {
                const cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(x, y)];
                else newGrid[cellCord] = this.newCellState(x, y);
            }
        }

        // Explicitly delete old arrays to free memory
        delete this.grid;
        delete this.gridNext;

        this.grid = newGrid;
        this.gridNext = [...this.grid];
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }

    restart(){
        this.gridWidth = 0;
        this.gridHeight = 0;
        super.restart();
    }
}

module.exports = Grid;
},{"./animation":3}],14:[function(require,module,exports){
'use strict';

// TODO: Refactor/wrap this code into animation/background controller class/module

// Require
// ---------------------------------------------------------------------------------------------------------------------

const Utils = require("./utils");

const ThreeNPlusOne = require("./3n+1");
const Cardioids = require("./cardioids");
const CircularWaves = require("./circular-waves");
const Coding = require("./coding");
const FiguresSpiral = require("./figures-spiral");
const GameOfLife = require("./game-of-life");
const GameOfLifeIsometric = require("./game-of-life-isometric");
const Glitch = require("./glitch");
const GradientDescent = require("./gradient-descent");
const Matrix = require("./matrix");
const MLinPL = require("./mlinpl");
const Network = require("./network");
const NeuralNetwork = require("./neural-network");
const ParticlesAndAttractors = require("./particles-and-attractors");
const ParticlesVortex = require("./particles-vortex");
const ParticlesWaves = require("./particles-waves");
const PerlinNoiseParticles = require("./perlin-noise-particles");
const RockPaperScissorsAutomata = require("./rock-paper-scissors-automata");
const SandAutomata = require("./sand-automata");
const Quadtree = require("./quadtree");
const RecursiveRectangles = require("./recursive-rectangles");
const ShortestPath = require("./shortest-path");
const SineWaves = require("./sine-waves");
const Sorting = require("./sorting");
const SpinningShapes = require("./spinning-shapes");
const Spirograph = require("./spirograph");
const Tree = require("./tree");


// Globals
// ---------------------------------------------------------------------------------------------------------------------

const canvas = document.getElementById("background");
const container = document.getElementById("background-container");
let fps = 30,
    framesInterval = 1000 / fps,
    then = 0,
    paused = false,
    width = 0,
    height = 0,
    lastWidth = 0,
    lastHeight = 0,
    resizeMode = "fit",
    fixedWidth = 0,
    fixedHeight = 0;

// For stats
let sampleSize = 30,
    frames = 0,
    avgDrawTime = 0,
    avgElapsedTime = 0, 
    trueThen = 0;

const colors = [ // Green palette
    "#349BA9",
    "#41B8AD",
    "#73D4AD",
    "#AEEABF",
    "#73D4AD",
    "#41B8AD",
];

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
    "#B6245C",
    "#E14F3B",
    "#EC8C4D",
    "#FFF202",
    "#99F32B",
    "#106AA6",
    "#283B93",
];


// Get elements for different animation controls
// ---------------------------------------------------------------------------------------------------------------------

const content = document.getElementById("me");
const elemBgShow = document.getElementById("background-show");
const elemBgName = document.getElementById("background-name");
const elemBgDesc = document.getElementById("background-description");
const elemBgPrev = document.getElementById("background-previous");
const elemBgNext = document.getElementById("background-next");
const elemBgCode = document.getElementById("background-code");
const elemBgReset = document.getElementById("background-reset");
const elemBgRestart = document.getElementById("background-restart");
const elemBgPlayPause = document.getElementById("background-play-pause");
const elemBgSettings = document.getElementById("background-settings");
const elemBgSettingsControls = document.getElementById("background-settings-controls");
const elemBgSettingsClose = document.getElementById("background-settings-close");
const elemBgStats = document.getElementById("background-stats");
const elemBgAnimationSelect = document.getElementById("background-settings-animation-select");
const elemBgAnimationFps = document.getElementById("background-settings-animation-fps");
const elemBgAnimationSize = document.getElementById("background-settings-animation-size");


// Create the initial animation and initiate the animation loop
// ---------------------------------------------------------------------------------------------------------------------

let animations = [
    {class: ThreeNPlusOne, name: "3n+1"},
    {class: Cardioids, name: "cardioids"},
    {class: CircularWaves, name: "circular waves"},
    //{class: Coding, name: "coding"},  // Disabled till finished
    //{class: FiguresSpiral, name: "figures spiral"},  // Disabled since it's not that interesting
    {class: GameOfLife, name: "game of life"},
    {class: GameOfLifeIsometric, name: "isometric game of life"},
    {class: Glitch, name: "glitch"},
    {class: GradientDescent, name: "gradient descent"},
    {class: Matrix, name: "matrix rain"},
    //{class: MLinPL, name: "mlinpl"}, // Disabled cause it is not ready
    {class: Network, name: "network"},
    //{class: NeuralNetwork, name: "neural network"}, // Disabled till updated
    {class: ParticlesAndAttractors, name: "particles and attractors"},
    {class: ParticlesVortex, name: "particles vortex"},
    {class: ParticlesWaves, name: "particles waves"},
    {class: PerlinNoiseParticles, name: "perlin noise"},
    {class: RockPaperScissorsAutomata, name: "rock-paper-scissors automata"},
    {class: SandAutomata, name: "sand automata"},
    {class: Quadtree, name: "quadtree"},
    {class: RecursiveRectangles, name: "recursive rectangles"},
    {class: ShortestPath, name: "shortest path"},
    {class: Sorting, name: "sorting"},
    {class: SpinningShapes, name: "spinning shapes"},
    {class: Spirograph, name: "spirograph"},
    {class: SineWaves, name: "sine waves"},
    //{class: Tree, name: "tree"}, // Disabled cause it is not ready
];

const animationCount = animations.length;
let animationId = Utils.randomInt(0, animationCount);
while(animations[animationId].startAnimation === false) animationId = Utils.randomInt(0, animationCount);

// Get the animation from url search params
const urlParams = new URLSearchParams(window.location.search);
if(urlParams.has("animation")){
    const animationParam = urlParams.get("animation").replaceAll("-", " ");
    for(let i = 0; i < animationCount; ++i){
        if(animationParam === animations[i].name) animationId = i;
    }
}

let animation = null,
    order = Array.from({length: animationCount}, (x, i) => i);

Utils.randomShuffle(order);
for(let i = 0; i < animationCount; ++i){
    animations[order[i]].prev = order[(i + animationCount - 1) % animationCount];
    animations[order[i]].next = order[(i + 1) % animationCount];
}

function getTime(){
    return Date.now();
    //return window.performance.now(); // Alternative method for measruing time
}

function updateAnimation(newAnimationId) {
    frames = 0;
    avgDrawTime = 0;
    avgElapsedTime = 0;
    animationId = newAnimationId;
    animation = new animations[animationId].class(canvas, colors, colorsAlt);
    then = getTime();
    trueThen = then;
    animation.resize();
    updateUI();
}


function checkResize() {
    // Detect the change of container's size for smooth resizing
    if(resizeMode === "fit"){
        width = Math.max(container.offsetWidth, window.innerWidth - canvas.offsetLeft);
        height = Math.max(container.offsetHeight, window.innerHeight - canvas.offsetTop);
        if(width !== lastWidth || height !== lastHeight){
            canvas.width = width;
            canvas.height = height;
            animation.resize();
        } 
    } else {
        if(canvas.width !== fixedWidth || canvas.height !== fixedHeight){
            canvas.width = fixedWidth;
            canvas.height = fixedHeight;
            animation.resize();
        }
    }

    lastWidth = canvas.width;
    lastHeight = canvas.height;
}

function updateStats(timeElapsed, drawTime) {
    if(elemBgStats) {
        ++frames;
        avgElapsedTime = (avgElapsedTime * (sampleSize - 1) + timeElapsed) / sampleSize;
        avgDrawTime = (avgDrawTime * (sampleSize - 1) + drawTime) / sampleSize;

        if(frames % fps === 0){
            elemBgStats.innerHTML = `canvas size: ${canvas.width} x ${canvas.height}</br>
                                    target frames interval: ${Math.round(framesInterval)} ms</br>
                                    target fps: ${fps}</br>
                                    avg. frames interval: ${Math.round(avgElapsedTime)} ms</br>
                                    avg. fps: ${Math.round(1000 / avgElapsedTime)}</br>
                                    avg. draw time: ${Math.round(avgDrawTime + 1)} ms</br>
                                    possible fps: ${Math.round(1000 / avgDrawTime + 1)}`;
        }
    }
}

function render() {
    if(paused) return;

    const now = getTime();
    let timeElapsed = now - then;
        
    if(document.hidden){
        trueThen = now;
        then = now;
        timeElapsed = 0;
    }

    // Limit framerate
    if (timeElapsed >= framesInterval) {
        // Get ready for the next frame by setting then=now,
        // also, adjust for the screen refresh rate
        then = now - (timeElapsed % framesInterval);
        
        const drawStart = getTime();

        // Check if resize is needed
        checkResize();

        // Update the current animation and redraw the frame
        animation.update(timeElapsed);
        animation.draw();

        // Update the stats
        const drawTime = getTime() - drawStart;
        updateStats(now - trueThen, drawTime);
        trueThen = now;
   }

   requestAnimationFrame(render);
}

updateAnimation(animationId);
render();


// Support for mouse click (WIP)
// function getCursorPosition(canvas, event) {
//     const rect = canvas.getBoundingClientRect(),
//           x = event.clientX - rect.left,
//           y = event.clientY - rect.top;
//     return {x: x, y: y};
// }
//
// canvas.addEventListener('click', function(e) {
//     const cords = getCursorPosition(canvas, e);
//     console.log(`click!: ${cords.x}, ${cords.y}`)
//     animation.mouseAction(getCursorPosition(canvas, e));
// });


// Control functions
// ---------------------------------------------------------------------------------------------------------------------

function play(){
    elemBgPlayPause.innerHTML = "<i class=\"fas fa-pause\"></i> pause";
    paused = false;
    then = getTime();
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
        canvas.classList.remove("show-from-25");
        canvas.classList.add("fade-to-25");
        elemBgShow.innerHTML = "<i class=\"fas fa-eye\"></i> show";
    }

    function showBackground(){
        content.classList.remove("fade-in");
        content.classList.add("fade-out");
        canvas.classList.remove("faded-25");
        canvas.classList.remove("fade-to-25");
        canvas.classList.add("show-from-25");
        elemBgShow.innerHTML = "<i class=\"fas fa-eye-slash\"></i> hide";
    }

    elemBgShow.addEventListener("click", function () {
        if (content.classList.contains("fade-out")) hideBackground();
        else showBackground();
    });
}

if(elemBgPrev) {
    elemBgPrev.addEventListener("click", function () {
        updateAnimation(animations[animationId].prev);
        play();
    });
}

if(elemBgNext) {
    elemBgNext.addEventListener("click", function () {
        updateAnimation(animations[animationId].next);
        play();
    });
}

if(elemBgReset) {
    elemBgReset.addEventListener("click", function () {
        updateAnimation(animationId);
        play();
    });
}

if(elemBgRestart) {
    elemBgRestart.addEventListener("click", function () {
        animation.restart();
        play();
    });
}

if(elemBgPlayPause) {
    elemBgPlayPause.addEventListener("click", function () {
        if (paused === false) pause()
        else play();
    });
}

// Animation selection option
if(elemBgAnimationSelect) {
    elemBgAnimationSelect.addEventListener("input", function (e) {
        updateAnimation(parseInt(e.target.value));
    });
}

// Animation canvas size options
if(elemBgAnimationSize) {
    const animationSizes = ["fit", "512x512", "800x600", "1024x768", "1024x1024", "1280x720"];
    const animationSizeDefault = "fit";
    elemBgAnimationSize.innerHTML = "";
    for(let size of animationSizes) {
        if (size === animationSizeDefault) elemBgAnimationSize.innerHTML += `<option selected value="${size}">${size}</option>`;
        else elemBgAnimationSize.innerHTML += `<option value="${size}">${size}</option>`;
    }
    elemBgAnimationSize.addEventListener("input", function (e) {
        resizeMode = e.target.value;
        if(resizeMode !== "fit") {
            fixedWidth = parseInt(resizeMode.split("x")[0]);
            fixedHeight = parseInt(resizeMode.split("x")[1]);
        }
    });
}

// Animation FPS option
if(elemBgAnimationFps) {
    elemBgAnimationFps.innerHTML = '<option value="15">15</option><option selected value="30">30</option><option value="60">60</option>';
    elemBgAnimationFps.addEventListener("input", function (e) {
        fps = parseInt(e.target.value);
        framesInterval = 1000 / fps;
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
        if (elemBgSettingsControls.classList.contains("fade-out") || 
            elemBgSettingsControls.style.display === "none") showSettings();
        else closeSettings();
    });

    elemBgSettingsClose.addEventListener("click", function () {
        closeSettings();
    });

    // Events for dragging the background settings panel, TODO: make it work on mobile
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
            elemBgSettingsControls.style.maxHeight = elemBgSettingsControls.parentNode.offsetHeight - (e.clientY - elemBgSettingsControls.clickAnchorY) - 10 + 'px';
        }
    });

    addEventListener('mouseup', function (e) {
        elemBgSettingsControls.classList.remove('moving');
    });
}

function processDescription(description){
    // Replace string format
    const urlReplaceStrFormat = (prevContent, hrefContent, linkContent, followingContent) => 
        `${prevContent}<span class="nowrap">[<a href="${hrefContent}" target="_blank" rel="noopener noreferrer">${linkContent}</a>]</span>${followingContent}`;
    
    // Wrap urls into <a> tags
    const regexpToReplace = [
        // Wikipedia urls in the Markdown format ( [text](url) )
        {
            replaceStr: urlReplaceStrFormat('\$1', '\$3', '<i class="fa fa-wikipedia-w"></i> \$2', '\$4'), 
            regexp: /(.*)\[(.*)\]\((https?:\/\/(?:www\.)?en\.wikipedia\.org\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))\)(.*)/g
        },
        // YouTube urls
        {
            replaceStr: urlReplaceStrFormat('\$1', '\$3', '<i class="fa fa-youtube"></i> \$2', '\$4'),
            regexp: /(.*)\[(.*)\]\((https?:\/\/(?:www\.)?youtube\.com\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))\)(.*)/g
        },
        // GitHub urls
        {
            replaceStr: urlReplaceStrFormat('\$1', '\$3', '<i class="fa fa-github"></i> \$2', '\$4'), 
            regexp: /(.*)\[(.*)\]\((https?:\/\/(?:www\.)?github\.com\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))\)(.*)/g
        },
        // Other Markdown urls
        {
            replaceStr: urlReplaceStrFormat('\$1', '\$3', '<i class="fas fa-link"></i> \$2', '\$4'),
            regexp: /(.*)\[(.*)\]\((https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))\)(.*)/g
        },
        // lose urls
        {
            replaceStr: urlReplaceStrFormat('\$1', '\$2', '<i class="fas fa-link"></i> \$2', '\$3'),
            regexp: /(.*)[^"](https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))[^"](.*)/g
        },
    ]

    for(let r of regexpToReplace){
        description = description.replaceAll(r.regexp, r.replaceStr);
    }

    // Replace new lines \n with </br>
    description = description.trim().replaceAll("\n\n", "</p><p>");
    description = '<p>' + description + '</p>';

    return description;
}

function getPropId(propName){
    return propName.split(/(?=[A-Z])/).join(' ').toLowerCase().replaceAll(/\.|\]|s\[/g, '-');
}

function updateUI(){
    // Update basic controls
    if(elemBgName) elemBgName.innerHTML = animation.getName();
    if(elemBgCode) elemBgCode.href = animation.getCodeUrl();
    if(elemBgDesc) elemBgDesc.innerHTML = processDescription(animation.getDescription());

    // Update list of animations
    let animationSelectOptions = "";
    for(let i = 0; i < animations.length; ++i){
        const name = animations[i].name;
        if(animations[animationId].name === name)
            animationSelectOptions += `<option selected value="${i}">${name}</option>`
        else animationSelectOptions += `<option value="${i}">${name}</option>`
    }
    elemBgAnimationSelect.innerHTML = animationSelectOptions;

    // Update list of animations options
    const settings = animation.getSettings();
    let elemBgSettingsList = document.getElementById("background-settings-controls-list");
    if(elemBgSettingsControls && elemBgSettingsList) {
        elemBgSettingsList.innerHTML = "";

        if(settings.length === 0)
            elemBgSettingsList.innerHTML = "There are no settings (yet) for this animation";

        // Create settings controls
        settings.forEach(function(setting, index) {
            const value = eval(`animation.${setting.prop}`),
                  name = getPropId(setting.prop).replaceAll('-', ' '),
                  elemId = getPropId(setting.prop) + "-controls";

            let optionControls = `<div><span class="setting-name">${name}</span><span class="nowrap setting-value-control">`;

            if(["int", "float", "bool"].includes(setting['type'])) {
                // Set proper input parameters
                let inputParams = `name="${setting.prop}" id="${elemId}" value="${value}"`;
                if(["int", "float"].includes(setting.type)) {
                    if(setting.step) inputParams += ` step="${setting.step}"`;
                    else if(setting.type === "float") inputParams += ' step="0.01"';
                    else inputParams += ' step="1"';
                    inputParams += ` min="${setting["min"]}" max="${setting["max"]}"`;
                }
                if(setting.type === "bool" && value) inputParams += ' checked';
                
                // Add proper elements
                if(setting.type === "bool") optionControls += `<label class="form-checkbox setting-input"><input type="checkbox" ${inputParams}><i class="form-icon"></i></label>`
                else optionControls += `<input type="range" class="setting-input slider" ${inputParams}">`;
                optionControls += `[<output class="setting-value">${value}</output>]`;
            }
            if(setting.type === 'select') {
                optionControls += `<select class="form-select setting-select" name="${setting.prop}" id="${elemId}">`;
                for(let v of setting['values']) {
                    if(v === value) optionControls += `<option selected value="${v}">${v}</option>`;
                    else optionControls += `<option value="${v}">${v}</option>`;
                }
                optionControls += "</select>";
            }
            optionControls += "</span></div>";
            elemBgSettingsList.innerHTML += optionControls;
        });

        // Add events
        settings.forEach(function(setting, index) {
            const elemId = getPropId(setting.prop) + "-controls";
            let elem = document.getElementById(elemId);
            if(elem) {
                elem.addEventListener("input", function (e) {
                    if (e.target.type === "checkbox") {
                        if (e.target.parentNode.nextElementSibling !== null && 
                            e.target.parentNode.nextElementSibling.type === "output")
                            e.target.parentNode.nextElementSibling.value = e.target.checked;
                        eval(`animation.${setting.prop} = e.target.checked;`);
                    } else {
                        if(e.target.nextElementSibling !== null && e.target.nextElementSibling.type === "output") e.target.nextElementSibling.value = e.target.value;
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

},{"./3n+1":1,"./cardioids":4,"./circular-waves":5,"./coding":6,"./figures-spiral":8,"./game-of-life":10,"./game-of-life-isometric":9,"./glitch":11,"./gradient-descent":12,"./matrix":15,"./mlinpl":16,"./network":17,"./neural-network":18,"./particles-and-attractors":20,"./particles-vortex":21,"./particles-waves":22,"./perlin-noise-particles":23,"./quadtree":24,"./recursive-rectangles":26,"./rock-paper-scissors-automata":27,"./sand-automata":28,"./shortest-path":29,"./sine-waves":30,"./sorting":31,"./spinning-shapes":32,"./spirograph":33,"./tree":34,"./utils":35}],15:[function(require,module,exports){
'use strict';

const NAME = "Matrix digital rain",
      FILE = "matrix.js",
      DESC = `
Recreation of matrix digital rain based on this analysis
of the original effect on this 
[website](https://carlnewton.github.io/digital-rain-analysis/).

I'm a huge fan of the first movie.

Coded with no external dependencies, using only canvas API.
`;


const Animation = require("./animation");
const Utils = require("./utils");

class Matrix extends Animation {
    constructor(canvas, colors, colorsAlt,
                dropsSize = 20,
                dropsSpeed = 0.6,
                fadingSpeed = 0.01,
                originalMatrixColors = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.dropsSize = dropsSize;
        this.dropsSpeed = dropsSpeed;
        this.fadingSpeed = fadingSpeed;
        this.originalMatrixColors = originalMatrixColors;

        this.flipProp = 0.25; // Probability of flipping a character
        this.errorProp = 0.1; // Probability of drawing character in different row

        this.cellWidth = 0;
        this.cellHeight = 0;
        this.columns = 0;
        this.columnHeight = 0;
        this.drops = [];
        this.textColor = null;
        this.imageData = null;
        this.setColors();

        const katakana = "ｦｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾜﾝ",
              katakanaSubset = "ﾊﾋｼﾂｳｰﾅﾐﾓﾆｻﾜｵﾘﾎﾏｴｷﾑﾃｹﾒｶﾕﾗｾﾈｽﾀﾇ",
              digits = "0123456789",
              latin = "ABCDEFGHIKLMNOPQRSTVXYZ",
              symbols = "*+:=.<>#@!?^~\"",
              oldItalic = "𐌀𐌁𐌂𐌃𐌄𐌅𐌆𐌇𐌈𐌉𐌊𐌋𐌌𐌍𐌎𐌏𐌐𐌑𐌒𐌓𐌔𐌕𐌖𐌗𐌘𐌙𐌚";

        this.characters = katakana + digits + symbols;
    }

    dropSpawnPoint(y){
        return Utils.randomInt(0, Math.min(y - 1, this.columnHeight / 2), this.rand) - 1;
    }

    dropDespawn(y){
        return (this.rand() < Math.pow(y / this.columnHeight, 2) * 0.1) || (y > this.columnHeight);
    }

    drawCharacter(char, cellX, cellY, color){
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(cellX - this.cellWidth/2, cellY, this.cellWidth, this.cellHeight);
        this.ctx.fillStyle = color;

        if(this.rand() < this.flipProp){ // Randomly flip character
            this.ctx.save();
            this.ctx.translate(cellX, cellY);
            this.ctx.scale(-1, 1);
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
        } else this.ctx.fillText(char, cellX, cellY);
    }

    setColors(){
        if(this.originalMatrixColors){
            this.bgColor = "#000000";
            this.textColor = "#00FF00";
        } else {
            this.bgColor = "#FFFFFF";
            this.textColor = this.colors[0];
        }
    }

    draw() {
        if(this.originalMatrixColors) this.blendColorAlpha(this.bgColor, this.fadingSpeed, "darken");
        else this.blendColorAlpha(this.bgColor, this.fadingSpeed, "lighter");

        this.ctx.font = `${this.dropsSize}px monospace`;
        this.ctx.textAlign = "center"; // This helps with aligning flipped characters
        this.ctx.textBaseline = "top"; // This nicely align characters in a cells

        for(let d of this.drops){
            if(Math.floor(d.y) !== Math.floor(d.y + this.dropsSpeed)){
                d.y += this.dropsSpeed;
                const cellX = d.x * this.cellWidth + this.cellWidth / 2,
                      cellY = Math.floor(d.y) * this.cellHeight;

                this.drawCharacter(d.char, cellX, cellY, this.textColor);

                d.char = Utils.randomChoice(this.characters);
                if(this.dropDespawn(d.y)) d.y = this.dropSpawnPoint(d.y);

                if(this.rand() < this.errorProp){
                    const yDiff = Utils.randomInt(-8, 8);
                    this.drawCharacter(Utils.randomChoice(this.characters), cellX, Math.floor(yDiff + d.y) * this.cellHeight, this.textColor);
                }
            }
            else d.y += this.dropsSpeed;
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize() {
        this.clear();
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

        this.cellHeight = this.dropsSize;
        this.cellWidth = Math.ceil(this.dropsSize / 1.618);

        this.columns = this.ctx.canvas.width / this.cellWidth;
        this.columnHeight = this.ctx.canvas.height / this.cellHeight;

        if(this.drops.length < this.columns){
            for(let i = this.drops.length; i < this.columns; ++i){
                this.drops.push({char: Utils.randomChoice(this.characters), x: i, y: this.dropSpawnPoint(this.columnHeight)});
            }
        }
    }

    restart(){
        this.drops = [];
        this.setColors();
        this.resize();
        this.clear();
    }

    getSettings() {
        return [{prop: "dropsSize", type: "int", min: 8, max: 64, toCall: "resize"},
                {prop: "dropsSpeed", type: "float", min: 0, max: 1},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.5},
                //this.getSeedSettings()
                //{prop: "originalMatrixColors", type: "bool", toCall: "restart"} // Not ready yet
            ];
    }
}

module.exports = Matrix;

},{"./animation":3,"./utils":35}],16:[function(require,module,exports){
'use strict';

const NAME = "ML in PL Network",
      FILE = "mlinpl.js",
      DESC = `
Simple network animation, I've created for ML in PL websites.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class MLinPL extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlesDensityModifier = 1,
                connectionDistanceThreshold = 125) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.particlesDensityModifier = particlesDensityModifier;
        this.connectionDistanceThreshold = connectionDistanceThreshold;

        this.width = 0;
        this.height = 0;

        this.mainColors = ["#000000"];  // 
        this.bgParticles = []; // Background particles
        this.mgParticles = []; // Middle ground particles
        this.fgParticles = []; // Foreground particles
        this.bgParticlesCfg = {
            colors: "#EEE",
            lineColors: "#EEE",
            sizeMin: 4,
            sizeRange: 3,
            speedMax: 0.5,
            groups: [[0, 1], [0, 2], [1, 2]],
            density: 0.00015
        };
        this.mgParticlesCfg = {
            colors: "#AAA",
            lineColors: "#AAA",
            sizeMin: 2,
            sizeRange: 2,
            speedMax: 0.75,
            groups: [[]], // This group of particles has no connecting lines
            density: 0.00015
        };
        this.fgParticlesCfg = {
            colors: {1: 0.2, 0: 0.8},
            lineColors: {"#000": 0.3, "#222": 0.3, "#444": 0.3},
            sizeMin: 2,
            sizeRange: 5,
            speedMax: 1,
            groups: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4], [0], [1], [2], [3], [4], [0], [1], [2], [3], [4]],
            density: 0.0003
        };
    }

    updateParticle(p, elapsed){
        let prevSinVal = Math.sin(p.x / p.freq) * p.amp;
        p.x += p.velX;
        let nextSinVal = Math.sin(p.x / p.freq) * p.amp;
        p.y += p.velY * (prevSinVal - nextSinVal);
    
        // Wrap around the left and right
        if(p.x < -connectionDistanceThreshold) p.x = width + connectionDistanceThreshold; 
        else if(p.x > width + connectionDistanceThreshold) p.x = -connectionDistanceThreshold;
        if(p.y + p.size >= height) p.velY *= -1;
    }

    spawnParticles(x, y, width, height) {
        this.bgParticles.push(...this.createParticles(x, y, width, height, bgParticlesCfg));
        this.mgParticles.push(...this.createParticles(x, y, width, height, mgParticlesCfg));
        this.fgParticles.push(...this.createParticles(x, y, width, height, fgParticlesCfg));
    }

    update(elapsed){
        // Update position of particles
        for (let p of particles) updateParticle(p, elapsed);
    }

    drawParticles(particles){
        // Draw lines between particles in the same group
        for (let i = 0; i < particles.length - 1; i++){
            // Skip particles that are not in any group - can't connect to any other particle
            if (particles[i].groups.length === 0) continue;
    
            for(let j = i + 1;  j < particles.length; j++){
                const p1 = particles[i],
                      p2 = particles[j];
    
                // This part can be done faster by creating indexes for groups, but I'm too lazy to implemt it
                if(Utils.distVec2d(p1, p2) > connectionDistanceThreshold) continue;
    
                for (let g of p1.groups){  
                    if (p2.groups.includes(g)){
                        Utils.drawLine(this.ctx, p1.x, p1.y, p2.x, p2.y, 1);
                        break;
                    }
                }
            }
        }
    
        // Draw all particles
        for (let p of particles) drawParticle(p);
    }

    draw() {
        this.clear();
        this.drawParticles(this.bgParticles);
        this.drawParticles(this.mgParticles);
        this.drawParticles(this.fgParticles);
    }

    restart(){
        this.resize();
    }

    resize() {
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
    
        // Reset and generate new particles 
        // (this is easier than trying to resize the existing ones)
        this.bgParticles = [];
        this.mgParticles = [];
        this.fgParticles = [];
        spawnParticles(0, 0, this.width, this.height);
    }

    getSettings() {
        return [this.getSeedSettings()];
    }
}

module.exports = MLinPL;

},{"./animation":3,"./utils":35}],17:[function(require,module,exports){
'use strict';

const NAME = "Delaunay triangulation for a cloud of particles",
      FILE = "network.js",
      DESC = `
In this animation, the Delaunay triangulation algorithm 
is applied to a set of moving particles (points).
Then if the edge length between two points is below a threshold value,
a line is drawn between them, creating a network-like structure.

You can read about the Delaunay triangulation on [Wikipedia](https://en.wikipedia.org/wiki/Delaunay_triangulation)

Source of Delaunay triangulation implementation used in this animation
can be found in this [repository](https://github.com/darkskyapp/delaunay-fast).
`;

const Animation = require("./animation");
const Utils = require("./utils");
const Delaunay = require("./delaunay");

class Network extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlesDensity = 0.0002,
                fillTriangles = true,
                drawParticles = false,
                distanceThreshold = 125) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.particlesDensity = particlesDensity;
        this.fillTriangles = fillTriangles;
        this.drawParticles = drawParticles;
        this.distanceThreshold = distanceThreshold;

        this.width = 0;
        this.height = 0;
        this.particles = [];
    }

    drawTriangle(p1, p2, p3){
        // Don't draw triangle if its area is too big.
        const maxDist = Math.max(Utils.distVec2d(p1, p2), Utils.distVec2d(p1, p2), Utils.distVec2d(p2, p3));
        if (maxDist > this.distanceThreshold) return;

        this.ctx.beginPath();
        Utils.pathClosedShape(this.ctx, [p1, p2, p3]);
        const color = Utils.lerpColor(p1.color, this.bgColor, Utils.easeInSine(maxDist / this.distanceThreshold));
        if(this.fillTriangles){
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }

    update(elapsed){
        super.update(elapsed);
        for(let p of this.particles){
            p.x += p.velX * elapsed * this.speed;
            p.y += p.velY * elapsed * this.speed;

            if(p.x < 0 || p.x > this.width) p.velX *= -1;
            if(p.y < 0 || p.y > this.height) p.velY *= -1;
        }
    }

    draw() {
        this.clear();
        if (this.particles.length > 0) {
            // Run Delaunay traiangulation to get points to create triangles with.
            let data = Delaunay.triangulate(this.particles.map(function(p) {
                return [p.x, p.y];
            }));

            // Display triangles individually.
            for (let i = 0; i < data.length; i += 3) {
                // Collect particles that make this triangle.
                const p1 = this.particles[data[i]],
                      p2 = this.particles[data[i + 1]],
                      p3 = this.particles[data[i + 2]];

                this.drawTriangle(p1, p2, p3);
            }
        }

        if(this.drawParticles) {
            for (let p of this.particles) Utils.fillCircle(this.ctx, p.x, p.y, 2, p.color);
        }
    }

    spawnParticles(x, y, width, height) {
        let newParticles = width * height * this.particlesDensity;

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            this.particles.push({
                x: this.rand() * width + x,
                y: this.rand() * height + y,
                velY: (this.rand() * 2 - 1) / 30,
                velX: (this.rand() * 2 - 1) / 30,
                color: Utils.randomChoice(this.colors, this.rand)
            });
        }
    }

    restart(){
        this.particles = []
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        this.spawnParticles(0, 0, this.width, this.height);
    }

    resize() {
        // Add particles to the new parts of the canvas.
        const divWidth = this.ctx.canvas.width - this.width,
              divHeight = this.ctx.canvas.height - this.height;

        if(divWidth > 0) this.spawnParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spawnParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spawnParticles(this.width, this.height, divWidth, divHeight);

        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;

        // Remove particles that are out of bounds of the new canvas to improve performance.
        const width = this.width,
              height = this.height;
        this.particles = this.particles.filter(function(p){
            return !(p.x < 0 || p.x > width || p.y < 0 || p.y > height);
        });
    }

    getSettings() {
        return [{prop: "particlesDensity", type: "float", step: 0.0001, min: 0.0001, max: 0.002, toCall: "restart"},
                {prop: "fillTriangles", type: "bool"},
                {prop: "drawParticles", type: "bool"},
                {prop: "distanceThreshold", type: "int", min: 0, max: 200},
                {prop: "speed", type: "float", step: 0.1, min: -4, max: 4}];
    }
}

module.exports = Network;

},{"./animation":3,"./delaunay":7,"./utils":35}],18:[function(require,module,exports){
'use strict';

/*
 * Temporarily disabled, this old animation needs some improvement to be visualy pleasing.
 *
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

        this.fps = 1.5; // Override default framerate
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
        this.clear();

        // Draw connections
        for (let i = 0; i < this.nLayers - 1; i++) {
            const l1 = this.network[i],
                  l2 = this.network[i + 1];
            for (let n1 of l1) {
                for (let n2 of l2) {
                    const v = Utils.clip(n1.v, 0, 1),
                          color = this.colors[this.colors.length - 1 - Math.floor(v * this.colors.length)];
                    this.ctx.globalAlpha = v;
                    Utils.drawLine(this.ctx, n1.x, n1.y, n2.x, n2.y, 1 + v, color);
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
                this.ctx.textAlign = "center";
                let text = `ReLU(${Utils.round(n.v, 2)}) = ${Utils.round(n.nlv, 2)}`;
                if(i === 0) text = `${Utils.round(n.v, 2)}`;
                else if(i === this.nLayers - 1) text = `Sigmoid(${Utils.round(n.v, 2)}) = ${Utils.round(n.nlv, 2)}`;
                this.ctx.fillText(text, n.x, n.y - 3 * this.baseNodeSize);
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

    getSettings() {
        return [] // TODO: add settings to this animation
    }
}

module.exports = NeuralNetwork;

},{"./animation":3,"./utils":35}],19:[function(require,module,exports){
'use strict';

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

},{}],20:[function(require,module,exports){
'use strict';

const NAME = "system of particles and attractors",
      FILE = "particles-and-attractors.js",
      DESC = `
Very simple particle system with attractors.
In this system, distance and momentum are ignored.
The new velocity vector of a particle is calculated as the sum of angles
between the particle and all attractors.
Because the velocity does not depend on the distance to the attractors,
and momentum is not preserved, the particles are not "catapulted" away from the attractors.
This results in a system that is mesmerizing to watch.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class ParticlesAndAttractors extends Animation {
    constructor (canvas, colors, colorsAlt,
                 numParticles= 10000,
                 particlesSpeed = "random",
                 fadingSpeed = 0.03,
                 numAttractors = 5,
                 centralAttractor = "random",
                 attractorsSystem = "random",
                 attractorsSpeed = "random",
                 drawAttractors = false,
                 scale = 1,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.particles = []
        this.numParticles = numParticles;
        this.particlesSpeed = this.assignIfRandom(particlesSpeed, Utils.round(Utils.randomRange(5, 15)));
        this.fadingSpeed = fadingSpeed;

        this.drawAttractors = drawAttractors;
        this.numAttractors = numAttractors;
        this.centralAttractor = this.assignIfRandom(centralAttractor, Utils.randomChoice([false, true]));
        this.attractorsSystems = ["orbits", "eights"]
        this.attractorsSystem = this.assignIfRandom(attractorsSystem, Utils.randomChoice(this.attractorsSystems));
        this.attractorsSpeed = this.assignIfRandom(attractorsSpeed, Utils.round(Utils.randomRange(0.05, 0.1) * Utils.randomChoice([-1, 1])));
        this.attractorsPosition = 0;
        this.startingPosition = Utils.randomRange(0, 10);

        this.scale = scale;
        this.rainbowColors = rainbowColors;

        this.setup();
    }

    setup(){
        this.particles = []
        for (let i = 0; i < this.numParticles; ++i)
            this.particles.push(Utils.rotateVec2d(Utils.createVec2d(Utils.randomRange(1, 100, this.rand), 0), i));
    }

    update(elapsed){
        super.update(elapsed);
        this.attractorsPosition += elapsed / 1000 * this.attractorsSpeed;
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);

        const pos = this.startingPosition + this.attractorsPosition,
              numA = this.numAttractors + 1 - this.centralAttractor,
              startI = 1 - this.centralAttractor

        // Calculate positions of attractors
        let attractors = [];
        if(this.attractorsSystem === "orbits") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / (2 * (this.numAttractors - 1));
            for (let i = startI; i < numA; ++i)
                attractors.push(Utils.rotateVec2d(Utils.createVec2d(i * s, 0), pos * i));
        } else if (this.attractorsSystem === "eights") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / this.numAttractors;
            for (let i = startI; i < numA; ++i)
                attractors.push(Utils.rotateVec2d(Utils.createVec2d(i * Math.sin(pos * Math.PI / 2) * s, 0), pos * i));
        }

        const color = this.rainbowColors ? `hsl(${this.time / 5 * 360}, 100%, 75%)` : this.colors[0];
        
        for (let p of this.particles) {
            let d = 0

            // Calculate direction of velocity vector for each particle
            for (let a of attractors) d += Math.atan2(a.y - p.y, a.x - p.x);

            // Calculate new position of the particle
            const prevX = p.x, prevY = p.y;
            p.x += Math.cos(d) * this.particlesSpeed;
            p.y += Math.sin(d) * this.particlesSpeed;

            // To make it look smooth even at high speeds, draw a line between the previous and new positions instead of a point
            Utils.drawLine(this.ctx, prevX, prevY, p.x, p.y, 1, color);
        }

        if(this.drawAttractors)
            for (let a of attractors)
                Utils.fillCircle(this.ctx, a.x, a.y, 5, this.colorsAlt[2])

        this.ctx.resetTransform();
    }

    resize() {
        this.clear();
    }

    restart() {
        super.restart();
        this.attractorsPosition = 0;
        this.setup();
    }

    getSettings() {
        return [{prop: "numParticles", type: "int", min: 1000, max: 15000, toCall: "setup"},
                {prop: "particlesSpeed", type: "float", min: 1, max: 20},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.1},
                {prop: "attractorsSystem", type: "select", values: this.attractorsSystems},
                {prop: "numAttractors", type: "int", min: 3, max: 7},
                {prop: "centralAttractor", type: "bool"},
                {prop: "attractorsSpeed", type: "float", min: -0.2, max: 0.2},
                {prop: "drawAttractors", type: "bool"},
                {prop: "scale", type: "float", min: 0.05, max: 1.95},
                {prop: "rainbowColors", type: "bool"}];
    }
}

module.exports = ParticlesAndAttractors;

},{"./animation":3,"./utils":35}],21:[function(require,module,exports){
'use strict';

const NAME = "vortex of particles",
      FILE = "particles-vortex.js",
      DESC = `
Particles vortex with randomized speed and direction.
The illusion of a 3D vortex is created by calculating the 2D position 
of each particle, each frame, using simple trigonometry functions.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class ParticlesVortex extends Animation {
    constructor (canvas, colors, colorsAlt,
                 particles = 1500,
                 radius = "random",
                 speed = "random",
                 rotationSpeed = "random",
                 dirX = "random",
                 dirY = "random",
                 scale = 1){
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.particles = particles;

        this.radiusMin = 50;
        this.radiusMax = 250;
        this.radius = this.assignIfRandom(radius,
            Utils.round(Utils.randomRange(this.radiusMin, this.radiusMax), 2));

        this.speedMin = 0.02;
        this.speedMax = 0.05;
        this.speed = this.assignIfRandom(speed,
            Utils.round(Utils.randomRange(this.speedMin, this.speedMax) * Utils.randomChoice([-1, 1]), 2));

        this.rotationSpeedMin = 0.01;
        this.rotationSpeedMax = 0.02;
        this.rotationSpeed = this.assignIfRandom(rotationSpeed,
            Utils.round(Utils.randomRange(this.rotationSpeedMin, this.rotationSpeedMax) * Utils.randomChoice([-1, 1]), 2));

        this.dirMax = 0.75;
        this.dirX = this.assignIfRandom(dirX, Utils.round(Utils.randomRange(-this.dirMax, this.dirMax), 2));
        this.dirY = this.assignIfRandom(dirY, Utils.round(Utils.randomRange(-this.dirMax, this.dirMax), 2));

        this.scale = scale;
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];

        const offset = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 4,
              centerX = this.ctx.canvas.width / 2 + this.dirX * offset,
              centerY = this.ctx.canvas.height / 2 + this.dirY * offset,
              s = Math.round(this.time * 10000) / 10;

        this.ctx.translate(centerX, centerY);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.beginPath();
        for(let i = 1; i <= this.particles; i++){
            const r = this.radius + Math.pow(i / (this.particles / 1.5), 2) * i / 2,
                  p = this.noise.perlin2(i * 0.1 + s, 0.1) * 100 + s * this.rotationSpeed,
                  x = Math.cos(p) * r + Math.sqrt(i * this.radius) * this.dirX,
                  y = Math.sin(p) * r + Math.sqrt(i * this.radius) * this.dirY;

            Utils.pathCircle(this.ctx, x, y, i * 0.01);
        }
        this.ctx.stroke();

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "particles", type: "int", min: 1, max: 3000},
                {prop: "radius", type: "float", min: this.radiusMin, max: this.radiusMax},
                {prop: "speed", type: "float", min: -this.speedMax, max: this.speedMax},
                {prop: "rotationSpeed", type: "float", min: -this.rotationSpeedMax, max: this.rotationSpeedMax},
                {prop: "dirX", type: "float", min: -this.dirMax, max: this.dirMax},
                {prop: "dirY", type: "float", min: -this.dirMax, max: this.dirMax}];
    }
}

module.exports = ParticlesVortex;

},{"./animation":3,"./noise":19,"./utils":35}],22:[function(require,module,exports){
'use strict';

const NAME = "particles waves",
      FILE = "particles-waves.js",
      DESC = `
"Particles waves" animation.
The effect was achieved by modifying Perlin noise animation.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class ParticlesStorm extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlesDensity = 0.01,
                noiseScale = 0.001,
                fadingSpeed = 0.02) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.particlesDensity = particlesDensity;
        this.noiseScale = noiseScale;
        this.fadingSpeed = fadingSpeed;

        this.particles = [];
        this.width = 0;
        this.height = 0;
    }

    update(elapsed) {
        super.update(elapsed);

        for(let p of this.particles){
            const theta = this.noise.perlin3(p.x * this.noiseScale * 2,
                                             p.y * this.noiseScale * 3,
                                             this.frame * this.noiseScale * 3) * 2 * Math.PI;
            p.x += 2 * Math.tan(theta);
            p.y += 2 * Math.sin(theta);

            // Wrap particles
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width ) p.x = 0;
            if (p.y < 0) p.y = this.height;
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
        this.clear();
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        const newParticles = this.width * this.height * this.particlesDensity;

        // Create new particles
        this.particles = [];
        for(let i = 0; i < newParticles; i++){
            const particleX = this.rand() * this.width,
                  particleY = this.rand() * this.height;
            this.particles.push({
                x: particleX,
                y: particleY,
                color: Utils.lerpColor(this.colorA, this.colorB, particleX / this.width)
            });
        }
    }

    getSettings() {
        return [{prop: "particlesDensity", type: "float", step: 0.0001, min: 0.0001, max: 0.05, toCall: "resize"},
                {prop: "noiseScale", type: "float", step: 0.001, min: 0.001, max: 0.01},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.1},
                this.getSeedSettings()];
    }
}

module.exports = ParticlesStorm;

},{"./animation":3,"./noise":19,"./utils":35}],23:[function(require,module,exports){
'use strict';

// TODO: Improve this description
const NAME = "particles moving through Perlin noise",
      FILE = "perlin-noise-particles.js",
      DESC = `
Particles moving through Perlin noise.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class PerlinNoiseParticles extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlesDensity = 0.0006,
                noiseScale = 0.001,
                particlesSpeed = 1,
                particlesSize = 1,
                fadingSpeed = 0) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.particlesDensity = particlesDensity;
        this.noiseScale = noiseScale;
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.particlesSpeed = particlesSpeed;
        this.particlesSize = particlesSize;
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
            // To make it look smooth even at high speeds, draw a line between the previous and new positions instead of a point
            // Drawing a line also results with a better antialiasing
            Utils.drawLine(this.ctx, p.prevX, p.prevY, p.x, p.y, 2 * p.radius * this.particlesSize, p.color); 
        }
        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    spawnParticles(x, y, width, height) {
        let newParticles = width * height * this.particlesDensity;

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            const particleX = this.rand() * width + x,
                  particleY = this.rand() * height + y;
            this.particles.push({
                x: particleX,
                y: particleY,
                prevX: particleX,
                prevY: particleY,
                speed: this.rand() * 0.20 + 0.10,
                radius: this.rand() * 0.5 + 0.5,
                color: Utils.randomChoice(this.colors)
            });
        }
    }

    reset(){
        this.clear();
        this.particles = []
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        this.spawnParticles(0, 0, this.width, this.height);
    }

    resize() {
        this.clear();
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

        // Add particles to the new parts of the canvas.
        const divWidth = this.ctx.canvas.width - this.width,
              divHeight = this.ctx.canvas.height - this.height;

        if(divWidth > 0) this.spawnParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spawnParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spawnParticles(this.width, this.height, divWidth, divHeight);

        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;

        // Remove particles that are out of bounds of the new canvas to improve performance.
        const width = this.width,
              height = this.height;
        this.particles = this.particles.filter(function(p){
            return !(p.x < 0 || p.x > width || p.y < 0 || p.y > height);
        });
    }

    getSettings() {
        return [{prop: "noiseScale", type: "float", step: 0.001, min: 0.001, max: 0.01, toCall: "reset"},
                {prop: "particlesDensity", type: "float", step: 0.0001, min: 0.0001, max: 0.005, toCall: "reset"},
                {prop: "particlesSpeed", type: "float", min: 0.25, max: 32},
                {prop: "particlesSize", type: "float", step: 0.1, min: 1, max: 4},
                {prop: "fadingSpeed", type: "float", step: 0.0001, min: 0, max: 0.01},
                this.getSeedSettings()];
    }
}

module.exports = PerlinNoiseParticles;

},{"./animation":3,"./noise":19,"./utils":35}],24:[function(require,module,exports){
'use strict';

const NAME = "quadtree visualization",
      FILE = "quadtree.js",
      DESC = `
Visualization of quadtree for points generated by thresholding Perlin noise.
Quadtree is a data structure that is 2-dimensional, special variant of k-d trees.

You can read about quadtree on [Wikipedia](https://en.wikipedia.org/wiki/Quadtree).

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");
const Noise = require("./noise");

class Quadtree extends Animation {
    constructor(canvas, colors, colorsAlt,
                maxPointsInNode = 1,
                pointsDensity = 0.4,
                drawPoints = false,
                noiseScale = 0.002,
                noiseSpeed = {x: "random", y: "random", z: 1},
                noiseThreshold = 0.01,
                drawLeafNode = true) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.pointsDensity = pointsDensity;
        this.drawPoints = drawPoints;
        this.maxPointsInNode = maxPointsInNode;
        this.noiseThreshold = noiseThreshold;
        this.drawLeafNodes = drawLeafNode;
        
        this.noiseScale = noiseScale;
        this.noiseSpeed = noiseSpeed;
        this.noiseSpeed.x = this.assignIfRandom(this.noiseSpeed.x, Utils.round(Utils.randomRange(-1, 1), 1));
        this.noiseSpeed.y = this.assignIfRandom(this.noiseSpeed.y, Utils.round(Utils.randomRange(-1, 1), 1));
        
        this.minNodeSize = 4;

        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));
        this.width = 0;
        this.height = 0;
        this.noisePos = {x: 0, y: 0, z: 0};
    }

    update(elapsed){
        this.noisePos.x += this.noiseSpeed.x * elapsed / 1000 * 10;
        this.noisePos.y += this.noiseSpeed.y * elapsed / 1000 * 10;
        this.noisePos.z += this.noiseSpeed.z * elapsed / 1000 * 0.05;
        super.update(elapsed);
    }

    generatePoints(){
        let points = [];
        const spacing = 1 / this.pointsDensity,
              spacingHalf = spacing / 2;
        let rng = Utils.Mulberry32(this.seed);
        for(let x = spacingHalf; x < this.width; x += spacing){
            for (let y = spacingHalf; y < this.height; y += spacing){
                const noiseVal = this.noise.perlin3(
                    (x + this.noisePos.x) * this.noiseScale, 
                    (y + this.noisePos.y) * this.noiseScale, 
                    this.noisePos.z);
                if(Math.abs(noiseVal) <= this.noiseThreshold){
                    // To make it look more natural add some small random offset to the point's position
                    points.push({
                        x: x - spacingHalf + rng() * spacing,
                        y: y - spacingHalf + rng() * spacing,
                    });
                }
            }
        }
        return points;
    }

    quadTree(x, y, size, points, depth){
        const sizeHalf = size / 2,
              sizeQuar = size / 4;
        if (points.length <= this.maxPointsInNode || size <= this.minNodeSize) {
            if(size > this.minNodeSize || this.drawLeafNodes) this.ctx.strokeRect(x - sizeHalf, y - sizeHalf, size, size);
        } else {
            let nwPoints = [],
                nePoints = [],
                swPoints = [],
                sePoints = [];
            for(let p of points){
                if(p.x < x && p.y >= y) nwPoints.push(p);
                else if(p.x >= x && p.y >= y) nePoints.push(p);
                else if(p.x >= x && p.y < y) sePoints.push(p);
                else if(p.x < x && p.y < y) swPoints.push(p);
            }
            ++depth;
            this.quadTree(x + sizeQuar, y + sizeQuar, sizeHalf, nePoints, depth);
            this.quadTree(x + sizeQuar, y - sizeQuar, sizeHalf, sePoints, depth);
            this.quadTree(x - sizeQuar, y + sizeQuar, sizeHalf, nwPoints, depth);
            this.quadTree(x - sizeQuar, y - sizeQuar, sizeHalf, swPoints, depth);
        }
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        this.width = this.ctx.canvas.width,
        this.height = this.ctx.canvas.height;

        let maxRectSize = Math.max(this.width, this.height),
            points = this.generatePoints();

        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];
        this.quadTree(this.width / 2, this.height / 2, maxRectSize, points, 0);

        if(this.drawPoints){
            this.ctx.fillStyle = this.colorsAlt[1];
            if(this.pointsDensity < 0.5)
                for(let p of points) Utils.fillCircle(this.ctx, p.x, p.y, 2, this.colorsAlt[1]);
            else
                for(let p of points) this.ctx.fillRect(p.x, p.y, 2, 2);
        }
    }

    restart(){
        this.noisePos = {x: 0, y: 0, z: 0};
        super.restart();
    }

    getSettings() {
        return [{prop: "maxPointsInNode", type: "int", min: 1, max: 16},
                {prop: "pointsDensity", type: "float", step: 0.1, min: 0.1, max: 0.7},
                {prop: "noiseScale", type: "float", step: 0.0001, min: 0.0005, max: 0.0125},
                {prop: "noiseSpeed.x", type: "float", step: 0.1, min: -10, max: 10},
                {prop: "noiseSpeed.y", type: "float", step: 0.1, min: -10, max: 10},
                {prop: "noiseSpeed.z", type: "float", step: 0.1, min: -10, max: 10},
                {prop: "noiseThreshold", type: "float", min: 0, max: 0.15, step: 0.001},
                //{prop: "minNodeSize", type: "float", step: 0.1, min: 1, max: 6},
                {prop: "drawLeafNodes", type: "bool"},
                {prop: "drawPoints", type: "bool"},
                this.getSeedSettings()];
    }
}

module.exports = Quadtree;

},{"./animation":3,"./noise":19,"./utils":35}],25:[function(require,module,exports){
'use strict';

/*
 * Simple and efficient implementation of a queue, with naive priority option
 * (the priority part is not efficient, but for animation purpose it doesn't have to).
 */

class Queue {
    constructor(initialCapacity = 32, priorityQueue = false, comperator = function(a, b){ return a.value < b.value; }) {
        this.array = new Array(initialCapacity);
        this.elemComperator = comperator;
        this.priorityQueue = priorityQueue;
        this.first = 0;
        this.size = 0;
    }

    getArrayIdx(idx){
        return (this.first + idx) % this.array.length;
    }

    push(elem){
        if (this.size >= this.array.length) {
            let newArray = new Array(this.size * 2);
            for (let i = 0; i < this.size; i++) newArray[i] = this.array[(this.first + i) % this.size];
            this.first = 0;
            this.array = newArray;
        }

        this.array[this.getArrayIdx(this.size)] = elem;
        ++this.size;

        if(this.priorityQueue && this.size > 1){
            for(let i = this.size - 1; i > 0; --i){
                let elemIdx = this.getArrayIdx(i);
                let nextIdx = this.getArrayIdx(i - 1);
                if(this.elemComperator(this.array[elemIdx], this.array[nextIdx]))
                    [this.array[elemIdx], this.array[nextIdx]] = [this.array[nextIdx], this.array[elemIdx]];
                else break;
            }
        }
    }

    pop(){
        if (this.size === 0) return null;
        this.size--;
        let elem = this.array[this.first];
        this.first = (this.first + 1) % this.array.length;
        return elem;
    }

    clear(){
        this.size = 0;
        this.first = 0;
    }
}

module.exports = Queue;

},{}],26:[function(require,module,exports){
'use strict';

const NAME = "recursive rectangles",
      FILE = "recursion-rectangles.js",
      DESC = `
Simple recursive animation. 
Each rectangle contains three smaller rectangles, which move around.
One randomly chosen rectangle is always moving to the empty space.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const AnimationQueue = require("./animation-queue");
const Utils = require("./utils");


class RecursiveRectangle {
    constructor(depth, rand) {
        this.depth = null;
        this.rand = rand;
        this.animQueue = new AnimationQueue();
        this.children = [];
        this.positions = {
            0: {x: 0, y: 0, from: [1, 2]},
            1: {x: 1, y: 0, from: [0, 3]},
            2: {x: 0, y: 1, from: [0, 3]},
            3: {x: 1, y: 1, from: [1, 2]},
        }

        this.setDepth(depth);
    }

    update(elapsed) {
        if(this.children.length === 0) return;

        for(let c of this.children){
            c.object.update(elapsed);
        }

        while(this.animQueue.step(elapsed) > 0){
            let takenPositions = new Set();
            for(let c of this.children) takenPositions.add(c.position);
            const freePositions = new Set([0, 1, 2, 3]),
                  freePosition = Utils.setsDifference(freePositions, takenPositions).values().next().value,
                  newPos = this.positions[freePosition],
                  positionToMove = Utils.randomChoice(newPos.from, this.rand);
            
                  let objectToMove = null;
            for(let c of this.children){
                if(c.position == positionToMove){
                    objectToMove = c;
                    break;
                }
            }

            const oldPos = this.positions[objectToMove.position],
                  duration = this.depth / 2;
            objectToMove.position = freePosition;

            const posEasing = Utils.easeInOutSine;
            this.animQueue.push(function (time) {
                const prog = Math.min(time, duration) / duration;
                objectToMove.x = Utils.lerp(oldPos.x, newPos.x, posEasing(prog));
                objectToMove.y = Utils.lerp(oldPos.y, newPos.y, posEasing(prog));
                return time - duration;
            });
        }
    }

    setDepth(depth) {
        if(depth === 0 && this.children.length){
            this.children = [];
            this.animQueue.clear();
        }
        else if(depth > 0){
            if (this.children.length === 0){
                this.children = [
                    {object: new RecursiveRectangle(depth - 1, this.rand), position: 0},
                    {object: new RecursiveRectangle(depth - 1, this.rand), position: 1},
                    {object: new RecursiveRectangle(depth - 1, this.rand), position: 2},
                ];
    
                for(let c of this.children){
                    c["x"] = this.positions[c.position]["x"];
                    c["y"] = this.positions[c.position]["y"];
                }
            } else {
                for(let c of this.children) c.object.setDepth(depth - 1);
            }
        }
        this.depth = depth;
    }

    draw(ctx, size) {
        const nextSize = size / 2;
        if(this.children.length === 0){
            ctx.strokeRect(-0.5 * size, -0.5 * size, nextSize, nextSize);
            ctx.strokeRect(0, -0.5 * size, nextSize, nextSize);
            ctx.strokeRect(-0.5 * size, 0, nextSize, nextSize);
            ctx.strokeRect(0, 0, nextSize, nextSize);
        }
        else {
            ctx.strokeRect(-0.5 * size, -0.5 * size, size, size);
            for(let c of this.children){
                ctx.save();
                ctx.translate((-0.5 + c.x) * nextSize, (-0.5 + c.y) * nextSize);
                c.object.draw(ctx, nextSize);
                ctx.restore();
            }
        }
    }
}

class RecursiveRectangles extends Animation {
    constructor(canvas, colors, colorsAlt, depth = 8, speed = 1) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.depth = depth;
        this.speed = speed;
        this.object = new RecursiveRectangle(this.depth, this.rand);
    }

    update(elapsed) {
        elapsed /= 1000;
        elapsed *= this.speed;
        this.object.update(elapsed);
    }

    draw() {
        this.clear();
        const size = Math.max(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.strokeStyle = this.colors[0];
        this.ctx.fillStyle = this.colors[0];
        this.ctx.translate(size / 2, size / 2);
        this.object.draw(this.ctx, size);
        this.ctx.resetTransform();
    }

    updateDepth() {
        this.object.setDepth(this.depth);
    }

    getSettings() {
        return [{prop: "depth", type: "int", min: 3, max: 12, toCall: "updateDepth"},
                {prop: "speed", type: "float", step: 0.25, min: 0.5, max: 8},
                this.getSeedSettings()];
    }
}

module.exports = RecursiveRectangles;

},{"./animation":3,"./animation-queue":2,"./utils":35}],27:[function(require,module,exports){
'use strict';

const NAME = "Rock-paper-scissors automata",
      FILE = "rock-paper-scissors-automata.js",
      DESC = `
Rock-paper-scissors automata.

This cellular automata adapts the rules of the rock-paper-scissors game 
(one type beats one state but loses to another).
If the cell has more than a defined number of neighbors with the state it losses to, 
it changes its state to that state.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");
const Utils = require("./utils");

class RockPaperScissorsAutomata extends Grid {
    constructor(canvas, colors, colorsAlt,
                cellSize = 9,
                states = 3,
                minimumLosses = 3) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.states = states;
        this.minimumLosses = minimumLosses;
    }

    update(elapsed){
        super.update(elapsed);

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const cellIdx = this.getIdx(x, y),
                      cellVal = this.grid[cellIdx],
                      nextVal = (cellVal + 1) % this.states;
                let neighbours = Array(this.states).fill(0);
                ++neighbours[this.getValWrap(x - 1, y - 1)];
                ++neighbours[this.getValWrap(x, y - 1)];
                ++neighbours[this.getValWrap(x + 1, y - 1)];
                ++neighbours[this.getValWrap(x - 1, y)];
                ++neighbours[this.getValWrap(x + 1, y)];
                ++neighbours[this.getValWrap(x - 1, y + 1)];
                ++neighbours[this.getValWrap(x, y + 1)];
                ++neighbours[this.getValWrap(x + 1, y + 1)];

                if(neighbours[nextVal] >= this.minimumLosses) this.gridNext[cellIdx] = nextVal;
                else this.gridNext[cellIdx] = cellVal;
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid];
    }

    draw() {
        Utils.clear(this.ctx, this.colors[0]); // Clear background to the color of the first state

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const val = this.getVal(x, y);
                if(val){ // Do not draw if the state is the first state (small optimization)
                    this.ctx.fillStyle = this.colors[val];
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }

    newCellState(x, y) {
        return Utils.randomInt(0, this.states, this.rand);
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 12, toCall: "resize"},
                {prop: "states", type: "int", min: 2, max: 6, toCall: "restart"},
                {prop: "minimumLosses", type: "int", min: 0, max: 8},
                this.getSeedSettings()];
    }
}

module.exports = RockPaperScissorsAutomata;

},{"./grid":13,"./utils":35}],28:[function(require,module,exports){
'use strict';

const NAME = "Rock-paper-scissors automata",
      FILE = "rock-paper-scissors-automata.js",
      DESC = `
Sand automata.

This cellular automata is a simple model of falling sand.
I generates random tetris blocks and lets them fall to demonstrate
the properties of automata.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");
const Utils = require("./utils");

class SandAutomata extends Grid {
    constructor(canvas, colors, colorsAlt,
                cellSize = 4,
                blockSize = 4) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.blockSize = blockSize;
        this.maxBlockSize = 12;
        
        // All tetris blocks with all rotations
        this.blocksTemplates = [
            ["XXXX"],
            ["X",
             "X",
             "X",
             "X"],

            ["XX ",
             " XX"],
            ["X ",
             "XX",
             " X"],

            [" XX",
             "XX "],
            [" X",
             "XX",
             "X "],

            ["XX",
             "XX"],
            ["XX",
             "XX"],
            
            ["XXX",
             " X "],
            [" X ",
             "XXX"],
            ["X ",
             "XX",
             "X "],
            [" X",
             "XX",
             " X"],
            
            ["XXX",
             "  X"],
            ["X  ",
             "XXX"],
            ["XX",
             "X ",
             "X "],
            [" X",
             " X",
             "XX"],
            
            ["XXX",
             "X  "],
            ["  X",
             "XXX"],
            ["X ",
             "X ",
             "XX"],
            ["XX",
             " X",
             " X"],
        ]

        this.generateBlocks();
    }

    generateBlocks(){
        // Generate real blocks
        this.blocks = [];
        for(let tempalte of this.blocksTemplates){
            let newBlock = [];
            for(let i = 0; i < tempalte.length * this.blockSize; ++i) newBlock.push([]);
            for(let i = 0; i < tempalte.length; ++i){
                for(let j = 0; j < tempalte[i].length; ++j){
                    const val = 1 ? tempalte[i][j] == "X" : 0;
                    for(let k = 0; k < this.blockSize; ++k){
                        for(let l = 0; l < this.blockSize; ++l){
                            newBlock[i * this.blockSize + k].push(val);
                        }
                    }
                }
            }

            this.blocks.push(newBlock);
        }
    }

    update(elapsed){
        super.update(elapsed);
        
        // Spawn some and very update
        if(this.frame % 30 == 0){
            const block = Utils.randomChoice(this.blocks, this.rand),
                  blockPos = Utils.randomInt(0, this.gridWidth - block[0].length, this.rand),
                  blockVal = Utils.randomInt(0, this.colors.length, this.rand) + 1;

            for(let x = 0; x < block[0].length; ++x){
                for(let y = 0; y < block.length; ++y){
                    const cellIdx = this.getIdx(blockPos + x, y),
                          cellVal = block[y][x];
                    this.grid[cellIdx] = cellVal * blockVal - 1;
                }
            }
        }

        // Update grid
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = this.gridHeight - 2; y >= 0; --y) {
                const cellIdx = this.getIdx(x, y),
                      cellVal = this.grid[cellIdx];
                
                if(cellVal < 0) continue;

                const belowIdx = this.getIdx(x, y + 1),
                      belowVal = this.grid[belowIdx];
                if(belowVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[belowIdx] = cellVal;
                    continue;
                }

                const leftIdx = this.getIdxWrap(x - 1, y + 1),
                      leftVal = this.grid[leftIdx];
                if(leftVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[leftIdx] = cellVal;
                    continue;
                }

                const rightIdx = this.getIdxWrap(x + 1, y + 1),
                      rightVal = this.grid[rightIdx];
                if(rightVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[rightIdx] = cellVal;
                    continue;
                }
            }
        }
    }

    draw() {
        this.clear(); // Clear background to the color of the first state

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 4 * this.blockSize; y < this.gridHeight; ++y) {
                const val = this.getVal(x, y),
                      drawY = y - 4 * this.maxBlockSize;
                if(val >= 0){ // Do not draw if the state is the first state (small optimization)
                    this.ctx.fillStyle = this.colors[val];
                    this.ctx.fillRect(x * this.cellSize, drawY * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize) + 4 * this.maxBlockSize;
        
        let newGrid = new Array(newGridWidth * newGridHeight);
        newGrid.fill(-1);

        const gridMinHeight = Math.min(this.gridHeight, newGridHeight),
              gridMinWidth = Math.min(this.gridWidth, newGridWidth);
        for (let y = 0; y < gridMinHeight; ++y) {
            for (let x = 0; x < gridMinWidth; ++x) {
                const newCellCord = x + y * newGridWidth;
                newGrid[newCellCord] = this.grid[this.getIdx(x, y)];
            }
        }

        // Explicitly delete old arrays to free memory
        delete this.grid;

        this.grid = newGrid;
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 2, max: 12, toCall: "resize"},
                {prop: "blockSize", type: "int", min: 1, max: this.maxBlockSize, toCall: "generateBlocks"},
                this.getSeedSettings()];
    }
}

module.exports = SandAutomata;

},{"./grid":13,"./utils":35}],29:[function(require,module,exports){
'use strict';

const NAME = "finding the shortest path",
      FILE = "shortest-path.js",
      DESC = `
Animation showing the process of finding the shortest path
in the grid world by BFS or A* algorithm.

In the 8-way variant, horizontal or vertical moves have a length (cost) of 1 
while diagonal moves have a length of sqrt(2).

The map is generated by recursively dividing rectangular rooms.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");
const Queue = require("./queue");

const EMPTY = 0,
      WALL = 1,
      START = 2,
      GOAL = 3,
      INQ = 4,
      VISITED = 5,
      PATH = 6;

class ShortestPath extends Animation {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 12,
                 searchAlgorithm = "A*", // or "BFS" or "random"
                 movementType = "random", // or "4-dir" or "8-dir"
                 speed = 1,
                 startNewAfterFinish = true,
                 cellStyle = "random", // or "sharp" or "rounded"
                 showStats = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.cellSize = cellSize;
        this.speed = speed;
        this.startNewAfterFinish = startNewAfterFinish;
        this.showStats = showStats;
        this.searchAlgorithms = ["BFS", "A*"];
        this.searchAlgorithm = this.assignIfRandom(searchAlgorithm, Utils.randomChoice(this.searchAlgorithms));
        this.movementTypes = ["4-dir", "8-dir"];
        this.movementType = this.assignIfRandom(movementType, Utils.randomChoice(this.movementTypes));
        this.cellStyles = ["sharp", "rounded"];
        this.cellStyle = this.assignIfRandom(cellStyle, Utils.randomChoice(this.cellStyles));

        this.updateName();
        this.queue = null;
        this.visited = 0;

        this.mapWidth = 0;
        this.mapHeight = 0;
        this.map = null;
        this.dist = null;
        this.prev = null;

        this.pathLenght = 0;
    }

    updateName(){
        this.name = `finding the shortest path using ${this.searchAlgorithm} algorithm`;
    }

    getIdx(x, y){
        return x + y * this.mapWidth;
    }

    getXY(idx){
        return Utils.createVec2d(idx % this.mapWidth, Math.floor(idx / this.mapWidth));
    }

    isWall(x, y){
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return true;
        else return (this.map[this.getIdx(x, y)] === WALL);
    }

    minDistance(nodePos1, nodePos2){
        const xDist = Math.abs(nodePos1.x - nodePos2.x),
              yDist = Math.abs(nodePos1.y - nodePos2.y);
        if(this.movementType === "4-dir") return xDist + yDist; // Manhattan distance
        else if(this.movementType === "8-dir"){
            const diagDist = Math.min(xDist, yDist);
            return diagDist * Math.sqrt(2) + xDist + yDist - 2 * diagDist;
        }
        else return 0;
    }

    // Function with the main logic, that expand the next node
    expandNextNode(){
        const item = this.queue.pop();
        if(item === null) return;

        ++this.visited;
        const idx = item.key,
              pos = this.getXY(idx),
              mapVal = this.map[idx];
        this.pathLenght = Math.max(this.pathLenght, this.dist[idx]);

        let nextIdxs = [];
        if(this.movementType === "4-dir") {
            nextIdxs = [this.getIdx(pos.x - 1, pos.y),
                        this.getIdx(pos.x, pos.y - 1),
                        this.getIdx(pos.x + 1, pos.y),
                        this.getIdx(pos.x, pos.y + 1)];
        }

        if(this.movementType === "8-dir"){
            nextIdxs = [this.getIdx(pos.x - 1, pos.y),
                        this.getIdx(pos.x - 1, pos.y - 1),
                        this.getIdx(pos.x, pos.y - 1),
                        this.getIdx(pos.x + 1, pos.y - 1),
                        this.getIdx(pos.x + 1, pos.y),
                        this.getIdx(pos.x + 1, pos.y + 1),
                        this.getIdx(pos.x, pos.y + 1),
                        this.getIdx(pos.x - 1, pos.y + 1)];
        }

        if(mapVal !== START && mapVal !== GOAL) this.map[idx] = VISITED;
        else if(mapVal === GOAL){
            let pathIdx = this.prev[idx];
            while(this.prev[pathIdx] >= 0) {
                this.map[pathIdx] = PATH;
                pathIdx = this.prev[pathIdx]
            }
            this.pathLenght = this.dist[idx];
            this.queue.clear();
            return;
        }

        for(let nextIdx of nextIdxs){
            const nextMapVal = this.map[nextIdx],
                  nodePos = this.getXY(nextIdx),
                  nodeDist = this.dist[idx] + this.minDistance(pos, nodePos);

            if(nextMapVal !== WALL && nodeDist < this.dist[nextIdx]){
                if(this.searchAlgorithm === "BFS") this.queue.push({key: nextIdx, value: nodeDist});
                else if(this.searchAlgorithm === "A*"){
                    const goalPos = this.getXY(this.goalIdx),
                          minDist = this.minDistance(nodePos, goalPos);
                    this.queue.push({key: nextIdx, value: nodeDist + minDist});
                }
                if(nextMapVal !== GOAL) this.map[nextIdx] = INQ;
                this.dist[nextIdx] = nodeDist;
                this.prev[nextIdx] = idx;
            }
        }
    }

    update(elapsed) {
        for (let i = 0; i < this.speed; ++i){
            this.expandNextNode();
            ++this.frame;
        }

        if (this.startNewAfterFinish && this.frame >= (this.visited + 300)) this.resize();
    }

    // Drawing functions
    drawWallCell(x, y, cellPadding){
        if(this.cellStyle === "sharp"){
            let paddingLeft = this.isWall(x - 1, y) ? 0 : cellPadding,
                paddingRight = this.isWall(x + 1, y) ? 0 : cellPadding,
                paddingTop = this.isWall(x, y - 1) ? 0 : cellPadding,
                paddingBottom = this.isWall(x, y + 1) ? 0 : cellPadding;

            this.ctx.fillRect(x * this.cellSize + paddingLeft, y * this.cellSize + paddingTop,
                this.cellSize - paddingLeft - paddingRight, this.cellSize - paddingTop - paddingBottom);
        }
        else if(this.cellStyle === "rounded") {
            this.ctx.beginPath();
            this.ctx.arc(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - cellPadding, 0, 2 * Math.PI, false);
            this.ctx.fill();

            const hCellSize = this.cellSize / 2,
                  drawX = x * this.cellSize,
                  drawY = y * this.cellSize,
                  drawCenterX = (x + 0.5) * this.cellSize,
                  drawCenterY = (y + 0.5) * this.cellSize,
                  drawEndX = (x + 1) * this.cellSize,
                  drawEndY = (y + 1) * this.cellSize;

            if (this.isWall(x - 1, y)) this.ctx.fillRect(drawX, drawY + cellPadding, hCellSize, this.cellSize - 2 * cellPadding);
            if (this.isWall(x + 1, y)) this.ctx.fillRect(drawCenterX, drawY + cellPadding, hCellSize, this.cellSize - 2 * cellPadding);
            if (this.isWall(x, y - 1)) this.ctx.fillRect(drawX + cellPadding, drawY, this.cellSize - 2 * cellPadding, hCellSize);
            if (this.isWall(x, y + 1)) this.ctx.fillRect(drawX + cellPadding, drawCenterY, this.cellSize - 2 * cellPadding, hCellSize);

            if (this.isWall(x - 1, y) && this.isWall(x, y - 1)) {
                this.ctx.beginPath();
                if(this.isWall(x - 1, y - 1)) this.ctx.rect(drawX, drawY, cellPadding, cellPadding);
                else {
                    this.ctx.arc(drawX, drawY, cellPadding, 0, Math.PI / 2, false);
                    this.ctx.lineTo(drawX + cellPadding, drawY + cellPadding);
                    this.ctx.lineTo(drawX + cellPadding, drawY);
                }
                this.ctx.fill();
            }

            if (this.isWall(x - 1, y) && this.isWall(x, y + 1)) {
                this.ctx.beginPath();
                if(this.isWall(x - 1, y + 1)) this.ctx.rect(drawX, drawEndY - cellPadding, cellPadding, cellPadding);
                else {
                    this.ctx.arc(drawX, drawEndY, cellPadding, Math.PI * 1.5, 0, false);
                    this.ctx.lineTo(drawX + cellPadding, drawEndY - cellPadding);
                    this.ctx.lineTo(drawX, drawEndY - cellPadding);
                }
                this.ctx.fill();
            }

            if (this.isWall(x + 1, y) && this.isWall(x, y - 1)) {
                this.ctx.beginPath();
                if(this.isWall(x + 1, y - 1)) this.ctx.rect(drawEndX - cellPadding, drawY, cellPadding, cellPadding);
                else {
                    this.ctx.arc(drawEndX, drawY, cellPadding, Math.PI / 2, Math.PI, false);
                    this.ctx.lineTo(drawEndX - cellPadding, drawY + cellPadding);
                    this.ctx.lineTo(drawEndX, drawY + cellPadding);
                }
                this.ctx.fill();
            }

            if (this.isWall(x + 1, y) && this.isWall(x, y + 1)) {
                this.ctx.beginPath();
                if(this.isWall(x + 1, y + 1)) this.ctx.rect(drawEndX - cellPadding, drawEndY - cellPadding, cellPadding, cellPadding);
                else {
                    this.ctx.arc(drawEndX, drawEndY, cellPadding, Math.PI, Math.PI * 1.5, false);
                    this.ctx.lineTo(drawEndX - cellPadding, drawEndY - cellPadding);
                    this.ctx.lineTo(drawEndX - cellPadding, drawEndY);
                }
                this.ctx.fill();
            }
        }
    }

    drawNodeCell(x, y, cellPadding){
        if(this.cellStyle === "sharp"){
            this.ctx.fillRect(x * this.cellSize + cellPadding, y * this.cellSize + cellPadding,
                this.cellSize - 2 * cellPadding, this.cellSize - 2 * cellPadding);
        }
        else if(this.cellStyle === "rounded") {
            this.ctx.beginPath();
            this.ctx.arc(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - cellPadding, 0, 2 * Math.PI, false);
            this.ctx.fill();
        }

        if(this.debug){
            this.ctx.fillStyle = "black";
            const goalPos = this.getXY(this.goalIdx),
                  minDist = Utils.round(this.minDistance({x: x, y: y}, goalPos), 1),
                  dist = Utils.round(this.dist[this.getIdx(x, y)], 1);
            this.ctx.fillText(`${dist}+${minDist}`, x * this.cellSize, y * this.cellSize);
            this.ctx.fillText( `=${Utils.round(dist + minDist)}`, x * this.cellSize, y * this.cellSize + 20);
        }
    }

    drawNodeConnection(idx){
        const pos = this.getXY(idx),
              prevPos = this.getXY(this.prev[idx]);
        this.ctx.beginPath();
        this.ctx.moveTo((pos.x + 0.5) * this.cellSize, (pos.y + 0.5) * this.cellSize);
        this.ctx.lineTo((prevPos.x + 0.5) * this.cellSize, (prevPos.y + 0.5) * this.cellSize);
        this.ctx.stroke();
    }

    draw() {
        this.clear();

        // Center the map
        this.ctx.translate(
            -(this.mapWidth * this.cellSize - this.ctx.canvas.width) / 2, 
            -(this.mapHeight * this.cellSize - this.ctx.canvas.height) / 2
        );
        
        // Draw nodes
        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                const idx = this.getIdx(x, y),
                      mapVal = this.map[idx];

                if([INQ, VISITED, PATH, GOAL].indexOf(mapVal) >= 0 && this.prev[idx] >= 0) {
                    if(mapVal === INQ) this.ctx.strokeStyle = this.colors[2];
                    else if(mapVal === VISITED) this.ctx.strokeStyle = this.colors[1];
                    else if(mapVal === PATH || mapVal === GOAL) this.ctx.strokeStyle = this.colorsAlt[2];
                    this.drawNodeConnection(idx);
                }
            }
        }

        // Draw walls
        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                const idx = this.getIdx(x, y),
                      mapVal = this.map[idx];

                if(mapVal === WALL){
                    this.ctx.fillStyle = this.colors[0];
                    this.drawWallCell(x, y, this.cellSize / 6);
                } else if(mapVal === START) {
                    this.ctx.fillStyle = this.colorsAlt[0];
                    this.drawNodeCell(x, y, 1);
                } else if(mapVal === GOAL) {
                    this.ctx.fillStyle = this.colorsAlt[1];
                    this.drawNodeCell(x, y, 1);
                } else if(mapVal === INQ) {
                    this.ctx.fillStyle = this.colors[2];
                    this.drawNodeCell(x, y, this.cellSize / 3);
                } else if(mapVal === VISITED) {
                    this.ctx.fillStyle = this.colors[1];
                    this.drawNodeCell(x, y, this.cellSize / 4);
                } else if(mapVal === PATH) {
                    this.ctx.fillStyle = this.colorsAlt[2];
                    this.drawNodeCell(x, y, this.cellSize / 6);
                }
            }
        }

        this.ctx.resetTransform();

        if(this.showStats){
            this.resetFont();
            const lineHeight = 20;
            Utils.fillAndStrokeText(this.ctx, `Search algorithm: ${this.searchAlgorithm}`, lineHeight, this.ctx.canvas.height - 3 * lineHeight);
            Utils.fillAndStrokeText(this.ctx, `Number of visited nodes: ${this.visited}`, lineHeight, this.ctx.canvas.height - 2 * lineHeight);
            let pathText = this.queue.size === 0 ? 'Shortest path length: ' : 'Longest traveled path: ';
            pathText += Utils.round(this.pathLenght);
            Utils.fillAndStrokeText(this.ctx, pathText, lineHeight, this.ctx.canvas.height - lineHeight);
        }
    }

    recursiveMaze(mazeX, mazeY, mazeW, mazeH){
        const minSize = 9,
              wallsMinDist = Math.floor(minSize / 3),
              wallSpawnProb = 1.0 - mazeW / this.mapWidth;

        const mazeEndX = mazeX + mazeW,
              mazeEndY = mazeY + mazeH;

        const wall1 = mazeW >= minSize && this.rand() > (wallSpawnProb * mazeH / mazeW),
              wall2 = mazeH >= minSize && this.rand() > wallSpawnProb;

        // let wallX = wall1 ? mazeX + Math.floor(mazeW / 2) : mazeX - 1,
        //     wallY = wall2 ? mazeY + Math.floor(mazeH / 2) : mazeEndY;

        let wallX, wallY;

        if(wall1) {
            do wallX = mazeX + Utils.randomInt(wallsMinDist, mazeW - wallsMinDist);
            while (this.map[this.getIdx(wallX, mazeY - 1)] !== WALL || this.map[this.getIdx(wallX, mazeEndY) !== WALL]);
        } else wallX = mazeX - 1;

        if(wall2) {
            do wallY = mazeY + Utils.randomInt(wallsMinDist, mazeH - wallsMinDist);
            while(this.map[this.getIdx(mazeX - 1, wallY)] !== WALL || this.map[this.getIdx(mazeEndX, wallY)] !== WALL);
        } else wallY = mazeEndY;

        if(wall1) {
            for (let y = 0; y < mazeH; ++y) this.map[this.getIdx(wallX, mazeY + y)] = WALL;
            this.map[this.getIdx(wallX, Utils.randomInt(mazeY, wallY))] = EMPTY;
            if(wall2) this.map[this.getIdx(wallX, Utils.randomInt(wallY + 1, mazeEndY))] = EMPTY;

            this.recursiveMaze(mazeX, mazeY, wallX - mazeX, wallY - mazeY);
            this.recursiveMaze(wallX + 1, mazeY, mazeEndX - wallX - 1, wallY - mazeY);
        }
        if(wall2){
            for (let x = 0; x < mazeW; ++x) this.map[this.getIdx(mazeX + x, wallY)] = WALL;
            if(wall1) this.map[this.getIdx(Utils.randomInt(mazeX, wallX), wallY)] = EMPTY;
            this.map[this.getIdx(Utils.randomInt(wallX + 1, mazeEndX), wallY)] = EMPTY;

            this.recursiveMaze(mazeX, wallY + 1, wallX - mazeX, mazeEndY - wallY - 1);
            this.recursiveMaze(wallX + 1, wallY + 1, mazeEndX - wallX - 1, mazeEndY - wallY - 1);
        }
    }

    resize() {
        this.mapWidth = Math.ceil(this.ctx.canvas.width / this.cellSize);
        this.mapHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.mapSize = this.mapWidth * this.mapHeight;
        this.map = new Array(this.mapSize);
        this.dist = new Array(this.mapSize);
        this.prev = new Array(this.mapSize);

        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                const idx = this.getIdx(x, y);
                if(x === 0 || x === (this.mapWidth - 1) || y === 0 || y === (this.mapHeight - 1)) this.map[idx] = WALL;
                else this.map[idx] = EMPTY;
                this.dist[idx] = 999999;
                this.prev[idx] = -1;
            }
        }

        this.recursiveMaze(1, 1, this.mapWidth - 2, this.mapHeight - 2);
        this.startIdx = 0;
        this.goalIdx = 0;

        // Generate random start position that is not a wall
        while(this.map[this.startIdx] === WALL)
            this.startIdx = this.getIdx(Utils.randomInt(1, this.mapWidth - 1), Utils.randomInt(1, this.mapHeight - 1));
            
        // Generate random goal position that is not a wall and is far away from the start position
        const startNode = this.getXY(this.startIdx),
              minDistance = (this.mapHeight + this.mapWidth) / 6;
        while(this.map[this.goalIdx] === WALL || this.minDistance(this.getXY(this.goalIdx), startNode) < minDistance)
            this.goalIdx = this.getIdx(Utils.randomInt(1, this.mapWidth - 1), Utils.randomInt(1, this.mapHeight - 1));

        this.restart();
        this.updateName();
    }

    restart(){
        this.frame = 0;
        this.visited = 0;
        this.pathLenght = 0;

        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                const idx = this.getIdx(x, y),
                      mapVal = this.map[idx];
                if(mapVal !== WALL){
                    this.map[idx] = EMPTY;
                    this.dist[idx] = 999999;
                    this.prev[idx] = -1;
                }
            }
        }

        this.map[this.startIdx] = START;
        this.dist[this.startIdx] = 0;
        this.map[this.goalIdx] = GOAL;
        this.priorityQueue = this.searchAlgorithm === "A*";
        this.queue = new Queue(this.mapSize, this.priorityQueue);
        this.queue.push({key: this.startIdx, value: 0});
    }

    getSettings() {
        return [{prop: "searchAlgorithm", type: "select", values: this.searchAlgorithms, toCall: "restart"},
                {prop: "movementType", type: "select", values: this.movementTypes, toCall: "restart"},
                {prop: "cellSize", type: "int", min: 8, max: 48, toCall: "resize"},
                {prop: "speed", type: "int", min: 1, max: 64},
                {prop: "startNewAfterFinish", type: "bool"},
                {prop: "cellStyle", type: "select", values: this.cellStyles},
                {prop: "showStats", type: "bool"},
                //this.getSeedSettings()
            ];
    }
}

module.exports = ShortestPath;

},{"./animation":3,"./queue":25,"./utils":35}],30:[function(require,module,exports){
'use strict';

const NAME = "grid of sine waves",
      FILE = "sine-waves.js",
      DESC = `
Grid of random sine waves.
The interesting "effects" for some waves is the artifact of drawing procedure
that draw lines between coordinates that are evenly distributed on the x-axis.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class SineWaves extends Animation {
    constructor(canvas, colors, colorsAlt,
                cellSize = 48,
                cellMargin = 12,
                rotateCells = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.cellSize = cellSize;
        this.cellMargin = cellMargin;
        this.rotateCells = rotateCells;
        this.speed = 0.5;

        this.gridWidth = 0;
        this.gridHeight = 0;
        this.waves = [];
    }

    drawWave(x, y, freq, amp, phase) {
        this.ctx.beginPath();
        this.ctx.moveTo(x - this.cellSize / 2, y + Math.sin(phase) * amp);
        for (let i = 0; i < this.cellSize; ++i) {
            this.ctx.lineTo(x - this.cellSize / 2 + i, y + Math.sin(i / this.cellSize * 2 * Math.PI * freq + phase) * amp);
        }
        this.ctx.stroke();
    }

    draw() {
        this.clear();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];

        const wavesToDraw = this.gridCellsWidth * this.gridCellsHeight;

        if(!this.rotateCells) this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        for(let i = 0; i < wavesToDraw; ++i){
            const x = this.cellMargin + (i % this.gridCellsWidth) * this.cellTotalSize - this.gridWidth / 2 + this.cellSize / 2,
                  y = this.cellMargin + Math.floor(i / this.gridCellsWidth) * this.cellTotalSize - this.gridHeight / 2 + this.cellSize / 2,
                  w = this.waves[i];
            this.ctx.strokeStyle = w.color;
            if(this.rotateCells) {
                this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
                this.ctx.translate(x, y);
                this.ctx.rotate(w.rotation * 2 * Math.PI);
                this.drawWave(0, 0, w.freq, this.cellSize * w.noise * 0.5, w.noise * Math.PI + this.time * Math.PI);
                this.ctx.resetTransform();
            } else this.drawWave(x, y, w.freq, this.cellSize * w.noise * 0.5, w.noise * Math.PI + this.time * Math.PI);
        }
        if(!this.rotateCells) this.ctx.resetTransform();
    }

    resize() {
        this.cellTotalSize = this.cellMargin + this.cellSize;
        this.gridCellsWidth = Math.floor((this.ctx.canvas.width - this.cellMargin) / this.cellTotalSize);
        this.gridCellsHeight = Math.floor((this.ctx.canvas.height - this.cellMargin) / this.cellTotalSize);
        this.gridWidth = this.cellMargin + this.gridCellsWidth * this.cellTotalSize;
        this.gridHeight = this.cellMargin + this.gridCellsHeight * this.cellTotalSize;

        const newWaves = Math.max(0, this.gridWidth * this.gridHeight - this.waves.length);
        for(let i = 0; i < newWaves; ++i){
            this.waves.push({
                freq: Math.pow(2, this.rand() * 8) * Utils.randomChoice([-1, 1], this.rand),
                noise: this.rand(),
                rotation: this.rand(),
                color: Utils.randomChoice(this.colors, this.rand)
            });
        }
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 16, max: 256, toCall: "resize"},
                {prop: "cellMargin", type: "int", min: 8, max: 32, toCall: "resize"},
                {prop: "rotateCells", type: "bool"},
                {prop: "speed", type: "float", step: 0.1, min: -4, max: 4}];
    }
}

module.exports = SineWaves;
},{"./animation":3,"./utils":35}],31:[function(require,module,exports){
'use strict';

const NAME = "sorting algorithm visualization",
      FILE = "sorting.js",
      DESC = `
Animated visualization of different sorting algorithms.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const AnimationQueue = require("./animation-queue");
const Utils = require("./utils");


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

class BubbleSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Bubble_sort
    constructor(arr) {
        super(arr, "bubble sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; ++i) {
            let sorted = true;
            for (let j = 0; j < n - 1 - i; ++j) {
                if (this.comp(this.arr, j, j + 1) > 0){
                    this.swap(this.arr, j, j + 1);
                    sorted = false;
                }
            }
            if(sorted) break;
        }
    }
}

class SelectionSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Selection_sort
    constructor(arr) {
        super(arr, "selection sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; ++i) {
            let m = i;
            for (let j = i; j < n; ++j) if (this.comp(this.arr, m, j) > 0) m = j;
            if (i !== m) this.swap(this.arr, i, m);
        }
    }
}

class InsertionSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Insertion_sort
    constructor(arr) {
        super(arr, "insertion sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 1; i < n; ++i) {
            let j = i;
            while (j > 0 && this.comp(this.arr, j, j - 1) < 0) {
                this.swap(this.arr, j, j - 1);
                --j;
            }
        }
    }
}

class MergeSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Merge_sort
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
        for (let i = l; i <= e; ++i) oldOrder.push(i);
        while (l <= m && r <= e) {
            if(this.comp(this.arr, l, r) < 0) newOrder.push(l++);
            else newOrder.push(r++);
        }
        while (l <= m) newOrder.push(l++);
        while (r <= e) newOrder.push(r++);
        this.rearrange(this.arr, oldOrder, newOrder)
    }
}

class QuickSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Quicksort
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
            while(this.compVal(this.arr[l], p) < 0) ++l;
            while(this.compVal(this.arr[r], p) > 0) --r;
            if (l <= r) this.swap(this.arr, l++, r--);
        }
        return l;
    }
}

class HeapSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Heapsort
    constructor(arr) {
        super(arr, "heap sort");
    }

    sort(){
        for (let i = Math.floor((this.arr.length - 1) / 2); i >= 0; --i) this.heapify(this.arr.length, i);

        for (let i = this.arr.length - 1; i > 0; --i) {
            this.swap(this.arr, 0, i);
            this.heapify(i, 0);
        }
    }

    heapify(n, i){
        let max = i,
            left = 2 * i + 1,
            right = 2 * i + 2;

        if (left < n && this.comp(this.arr, left, max) > 0) max = left;
        if (right < n && this.comp(this.arr, right, max) > 0) max = right;
        if (max !== i) {
            this.swap(this.arr, i, max);
            this.heapify(n, max);
        }
    }
}

class GnomeSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Gnome_sort
    constructor(arr) {
        super(arr, "gnome sort");
    }

    sort(){
        const n = this.arr.length;
        let pos = 0;
        while(pos < n){
            if(pos === 0 || this.comp(this.arr, pos, pos - 1) >= 0) ++pos;
            else{
                this.swap(this.arr, pos, pos - 1);
                --pos;
            }
        }
    }
}


class ShakerSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Cocktail_shaker_sort
    constructor(arr) {
        super(arr, "shaker sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n - 1; ++i) {
            let sorted = true;
            for (let j = 0; j < n - 1 - i; ++j) {
                if (this.comp(this.arr, j, j + 1) > 0){
                    this.swap(this.arr, j, j + 1);
                    sorted = false;
                }
            }
            if(sorted) break;

            sorted = true;
            for (let j = n - 2 - i; j > i ; --j) {
                if (this.comp(this.arr, j, j - 1) < 0){
                    this.swap(this.arr, j, j - 1);
                    sorted = false;
                }
            }
            if(sorted) break;
        }
    }
}


class Sorting extends Animation {
    constructor (canvas, colors, colorsAlt,
                 sortingAlgorithm = "random",
                 numElements = 96,
                 elementPadding = 2,
                 cmpDuration = 0.25,
                 swapDuration = 0.25,
                 speed = 1,
                 showStats = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.numElements = numElements;
        this.elementPadding = elementPadding;
        this.cmpDuration = cmpDuration;
        this.swapDuration = swapDuration;
        this.speed = speed;
        this.showStats = showStats;

        this.sortAlgoNames = ["selection sort", "bubble sort", "insertion sort",
            "quick sort", "merge sort", "heap sort", "gnome sort", "shaker sort"];
        this.sortAlgoClasses = [SelectionSort, BubbleSort, InsertionSort,
            QuickSort, MergeSort, HeapSort, GnomeSort, ShakerSort];
        this.sortingAlgorithm = this.assignIfRandom(sortingAlgorithm, Utils.randomChoice(this.sortAlgoNames));

        this.initialOrderTypes = ["random", "sorted", "reverse sorted", "evens then odds"];
        this.initialOrder = "random";

        this.cmpTotal = 0;
        this.cmpCount = 0;

        this.setup();
    }

    setup(){
        const valMax = this.numElements;
        this.animQueue = new AnimationQueue();

        // Initial order of values
        let values = Array.from({length: valMax}, (x, i) => i + 1);

        if(this.initialOrder === "random") Utils.randomShuffle(values, this.rand);
        else if(this.initialOrder === "reverse sorted") values = values.reverse();
        else if(this.initialOrder === "evens then odds")
            values = values.sort((a, b) => (a % 2 + a / (valMax + 1) - (b % 2 + b / (valMax + 1))));

        // Create elements
        this.elements = [];
        for(let i = 0; i < valMax; ++i){
            const val = values[i] / valMax,
                  color = Utils.lerpColor(this.colors[0], this.colors[2], val);
            this.elements.push({val: val, pos: i, color: color, z: 0})
        }

        // Sort
        let sortAlgoCls = this.sortAlgoClasses[this.sortAlgoNames.indexOf(this.sortingAlgorithm)],
            sortAlgo = new sortAlgoCls(this.elements);
        this.moves = sortAlgo.getMoves();
        this.name = sortAlgo.getName() + " algorithm visualization";

        this.cmpTotal = sortAlgo.cmpCount;
        this.cmpCount = 0;

        // Validate sorting
        /*
        for(let i = 1; i < this.elements.length; ++i){
            if(this.elements[i - 1] > this.elements[i]){
                console.log("The array is not sorted, something went wrong!");
                break;
            }
        }
        */
    }

    update(elapsed){
        elapsed /= 1000;
        elapsed *= this.speed;
        this.time += elapsed;
        ++this.frame;

        while(this.animQueue.step(elapsed) > 0){
            if(!this.moves.length) return;

            let s = this.moves[0];
            const colorEasing = (x) => x < 0.5 ? Utils.easeInOutCubic(2 * x) : 1 - Utils.easeInOutCubic(2 * x - 1),
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
                    return time - duration;
                });
            }
            else if(s[0] === "swap") {
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
                    return time - duration;
                });
            }

            this.moves.shift();
        }
    }

    draw() {
        this.clear();

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
            this.resetFont();
            const lineHeight = 20;
            Utils.fillAndStrokeText(this.ctx, `Sorting algorithm: ${this.sortingAlgorithm}`, lineHeight, elementMaxHeight - 3 * lineHeight);
            Utils.fillAndStrokeText(this.ctx, `Number of elements: ${this.numElements}`, lineHeight, elementMaxHeight - 2 * lineHeight);
            Utils.fillAndStrokeText(this.ctx, `Number of elements comparisons: ${this.cmpCount} / ${this.cmpTotal}`, lineHeight, elementMaxHeight - lineHeight);
        }
    }

    restart() {
        super.restart();
        this.setup();
    }

    getSettings() {
        return [{prop: "initialOrder", type: "select", values: this.initialOrderTypes, toCall: "setup"},
                {prop: "sortingAlgorithm", type: "select", values: this.sortAlgoNames, toCall: "setup"},
                {prop: "numElements", type: "int", min: 8, max: 256, toCall: "setup"},
                {prop: "speed", type: "float", step: 0.25, min: 0.5, max: 8},
                {prop: "showStats", type: "bool"},
                this.getSeedSettings()];
    }
}

module.exports = Sorting;

},{"./animation":3,"./animation-queue":2,"./utils":35}],32:[function(require,module,exports){
'use strict';

const NAME = "shapes dancing in a circle",
      FILE = "spinning-shapes.js",
      DESC = `
Just same shape "dancing" in a circle.
This animation recreates the effect 
described in this [article](https://observablehq.com/@rreusser/instanced-webgl-circles).

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class SpinningShapes extends Animation {
    constructor (canvas, colors, colorsAlt, 
                 shapes = 500,
                 vertices = 0,
                 rotateShapes = false,
                 scale = 1,
                 colorsScale = 1,
                 colorsShift = "random",
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.shapeNames = ["circles", "points", "lines", "triangles", "rectangles", "pentagons", "hexagons", "heptagons", "octagons"];
        this.vertices = this.assignIfRandom(vertices, Utils.randomInt(0, 8));
        this.updateName();
        this.rotateShapes = rotateShapes;
        this.shapes = shapes;

        this.distanceBase = 0.6;
        this.distanceRange = 0.2;
        this.sizeBase = 0.2;
        this.sizeRange = 0.12;

        this.scale = scale;
        this.colorsScale = colorsScale;
        this.colorsShift = this.assignIfRandom(colorsShift, Utils.randomChoice([0, 3.14]));
        this.rainbowColors = rainbowColors;
    }

    updateName(){
        this.name = this.shapeNames[this.vertices] + " \"dancing\" in a circle";
    }

    draw() {
        this.clear();

        const scale = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3 * this.scale;

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        for (let i = 0; i < this.shapes; ++i) {
            const theta = i / this.shapes * 2 * Math.PI,
                  distance = (this.distanceBase + this.distanceRange * Math.cos(theta * 6 + Math.cos(theta * 8 + this.time / 2))) * scale,
                  x = Math.cos(theta) * distance,
                  y = Math.sin(theta) * distance,
                  theta9 = theta * 9 - this.time,
                  radius = (this.sizeBase + this.sizeRange * Math.cos(theta9)) * scale,
                  color = (Math.cos((theta9 + this.colorsShift) * this.colorsScale) + 1) / 2;
            if(this.rainbowColors) this.ctx.strokeStyle = `hsl(${color * 360}, 100%, 75%)`;
            else this.ctx.strokeStyle = Utils.lerpColor(this.colorA, this.colorB, color);
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            if(this.vertices === 0) Utils.pathCircle(this.ctx, x, y, radius);
            if(this.vertices === 1) Utils.pathCircle(this.ctx, x, y, 1);
            else Utils.pathPolygon(this.ctx, x, y, radius, this.vertices, theta * this.rotateShapes);
            this.ctx.stroke();
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "vertices", type: "int", min: 0, max: 8, toCall: "updateName"},
                {prop: "shapes", type: "int", min: 0, max: 2500},
                {prop: "rotateShapes", type: "bool" },
                {prop: "distanceRange", type: "float", min: 0, max: this.distanceBase},
                {prop: "sizeRange", type: "float", min: 0, max: this.sizeBase},
                {prop: "scale", type: "float", min: 0.05, max: 1.95},
                {prop: "speed", type: "float", step: 0.1, min: -4, max: 4},
                {prop: "colorsShift", type: "float", min: 0, max: 3.14},
                {prop: "colorsScale", type: "float", min: 0.05, max: 2},
                {prop: "rainbowColors", type: "bool"}];
    }
}

module.exports = SpinningShapes

},{"./animation":3,"./utils":35}],33:[function(require,module,exports){
'use strict';

const NAME = "spirograph",
      FILE = "spirograph.js",
      DESC = `
Virtual spirograph created with 2-5 configurable gears.
Spirograph is a drawing toy that use gears to create patterns. I used to play with it a lot as a kid.

You can read about in on
[Wikipedia](https://en.wikipedia.org/wiki/Spirograph).
I also recommend to check this awesome [website] (http://www.eddaardvark.co.uk/v2/spirograph/spirograph2.html),
which is the source of inspiration for this animation.
And also this great [blogpost](https://www.bit-101.com/blog/2022/12/coding-curves-09-roulette-curves/)
that step by step how it works.

Try play with the gears' settings or hit reset button few times 
to get different random configurations.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class Spirograph extends Animation {
    constructor (canvas, colors, colorsAlt, 
                 vertices = 2500, 
                 lineLength = 2, 
                 gearCount = "random",
                 rescaleToFit = true,
                 scale = 1) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.vertices = vertices;
        this.lineLength = lineLength;
        this.maxGears = 5;
        this.rescaleToFit = rescaleToFit;
        this.scale = scale;
        this.speed = 1;

        this.gearCount = this.assignIfRandom(gearCount, Utils.randomInt(2, this.maxGears));
        this.gearNames = ["zero", "one", "two", "three", "four", "five"];
        this.updateName();
        this.setup();
    }

    setup(){
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
        this.name = "spirograph with " + this.gearNames[this.gearCount] + " gears";
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
        this.clear();

        let scale = 1;

        // Normalize size to fit the screen nicely
        if(this.rescaleToFit){
            let totalRadius = 0;
            for(let i = 0; i < this.gearCount; ++i) totalRadius += this.gears[i].radius;
            scale = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 / totalRadius;
        }

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);

        const length = Math.PI * this.lineLength,
              lenPerVertex = length / this.vertices;

        let start = this.getXY(0, this.time, scale);
        for (let i = 1; i < this.vertices; ++i) {
            let next = this.getXY(i * lenPerVertex, this.time, scale);
            const color = Utils.lerpColor(this.colorA, this.colorB, i / this.vertices);
            Utils.drawLine(this.ctx, start.x, start.y, next.x, next.y, 1, color);
            start = next;
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        let settings = [{prop: "vertices", type: "int", min: 100, max: 15000},
                        {prop: "lineLength", type: "float", step: 0.25, min: 1, max: 8},
                        {prop: "gearCount", type: "int", min: 2, max: this.maxGears, toCall: "updateName"},
                        {prop: "rescaleToFit", type: "bool"},
                        {prop: "scale", type: "float", min: 0.25, max: 4},
                        {prop: "speed", type: "float", step: 0.1, min: -4, max: 4}];
        for(let i = 0; i < this.maxGears; ++i){
            settings = settings.concat([{prop: `gears[${i}].radius`, type: "float", step: 0.01, min: 0, max: 100},
                                        {prop: `gears[${i}].rate`, type: "float", step: 0.01, min: -100, max: 100},
                                        {prop: `gears[${i}].phase`, type: "float", step: 0.001, min: -0.1, max: 0.1}]);
        }
        return settings;
    }
}

module.exports = Spirograph

},{"./animation":3,"./utils":35}],34:[function(require,module,exports){
'use strict';

/*
Work in progress.

Tree visualization algorithms:
- the Reingold–Tilford algorithm,
- the root-centric radial layout algorithm
- the parent-centric
- PLANET a radial layout algorithm 
(https://homexinlu.com/files/PLANETA%20radial%20layout%20algorithm%20for%20network%20visualization.pdf)
*/

const Animation = require("./animation");
const Utils = require("./utils");

class Tree extends Animation {
    constructor (canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "tree", "tree.js");
        this.frame = 0;
    }

    getName(){
        return "binary tree";
    }

    update(timeElapsed){
        this.frame++;
    }

    getFPS() {
        return 1;
    }

    branch(ctx, x, y, a, branchLength, branchAngle, levels){
        Utils.pathCircle(ctx, x, y, 5);
        if(levels > 0){
            const left = Utils.rotateVec2d({x: 0, y: branchLength}, a + branchAngle);
            Utils.pathLine(ctx, x, y, x + left.x, y + left.y);

            const right = Utils.rotateVec2d({x: 0, y: branchLength}, a - branchAngle);
            Utils.pathLine(ctx, x, y, x + right.x, y + right.y);

            const nextLength = branchLength * 4/7;
            const nextAngle = branchAngle * 7/9;
            this.branch(ctx, x + left.x, y + left.y, 0, nextLength, nextAngle, levels - 1);
            this.branch(ctx, x + right.x, y + right.y, 0, nextLength, nextAngle, levels - 1);

            //const nextLength = branchLength * 2/3;
            //this.branch(ctx, x + left.x, y + left.y, a + branchAngle, nextLength, branchAngle);
            //this.branch(ctx, x + right.x, y + right.y, a - branchAngle, nextLength, branchAngle);
        }
    }

    genTree(){
        this.tree.push({
            parent: 0,
            left: 0,
            right: 0,
            pred: 0,
            visited: false,
        });
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors[0];
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.branch(this.ctx, 0, 0, 0, 300, 80 * Math.PI / 180, 6);
        this.ctx.stroke();
    }

    resize() {

    }
}

module.exports = Tree;

},{"./animation":3,"./utils":35}],35:[function(require,module,exports){
'use strict';

/*
 * Module with some commonly used functions
 */

module.exports = {
    // Random generators
    // https://github.com/bryc/code/blob/master/jshash/PRNGs.md

    Lcg(s) { // Linear congruential generator
        return function () {
            s = Math.imul(48271, s) | 0 % 2147483647;
            return (s & 2147483647) / 2147483648;
        }
    },

    Mulberry32(a) { // Mulberry32
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    },

    // Randomization helpers
    randomRange(min, max, rndGen = Math.random) {
        return rndGen() * (max - min) + min;
    },

    randomInt(min, max, rndGen = Math.random) {
        return Math.floor(this.randomRange(min, max, rndGen));
    },

    randomChoice(arr, rndGen = Math.random) {
        return arr[Math.floor(rndGen() * arr.length)];
    },

    randomBoxMuller(rndGen = Math.random) {
        return Math.sqrt(-2.0 * Math.log( 1 - rndGen())) * Math.cos(2.0 * Math.PI * rndGen());
    },

    randomArray(length, min, max, rndGen = Math.random){
        return Array(length).fill().map(() => this.randomRange(min, max, rndGen))
    },

    randomShuffle(arr, rndGen = Math.random){
        for (let i = arr.length - 1; i > 0; --i) {
             const j = Math.floor(rndGen() * (i + 1)),
                   temp = arr[i];
             arr[i] = arr[j];
             arr[j] = temp;
        }
    },

    randomRulletChoice(dict, rndGen = Math.random){
        let total = 0;
        for (let key in dict) total += dict[key];
        let r = rndGen() * total;
        for (let key in dict){
            r -= dict[key];
            if (r < 0) return key;
        }
    },

    // Array/math helpers
    round(value, decimalPlace = 2){
        const shift = Math.pow(10, decimalPlace);
        return Math.round( value * shift) / shift;
    },

    argMax(arr) {
        return [].reduce.call(arr, (m, c, i, a) => c > a[m] ? i : m, 0)
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
        const ah = parseInt(a.replace('#', '0x'), 16),
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

    // Some basic vec operations
    createVec2d(x, y){
        return {x: x, y: y};
    },

    rotateVec2d(vec, r){
        const cos = Math.cos(r), sin = Math.sin(r);
        return {x: vec.x * cos - vec.y * sin, y: vec.x * sin + vec.y * cos};
    },

    mulVec2d(vec, val){
        return {x: vec.x * val, y: vec.x * val};
    },

    distVec2d(vec1, vec2){
        return Math.sqrt(Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2))
    },

    // Easing functions
    linear(x){
        return x;
    },

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

    drawLine(ctx, x1, y1, x2, y2, width, color){
        ctx.lineWidth = width;
        if(typeof color !== "undefined") ctx.strokeStyle = color;
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
        if(typeof color !== "undefined") ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
    },

    strokeCircle(ctx, x, y, radius, color){
        ctx.strokeStyle = color;
        if(typeof color !== "undefined") ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.stroke();
    },

    fillAndStrokeText(ctx, text, x, y){
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    },

    pathShape(ctx, points){
        if(points.length) {
            if(points[0].hasOwnProperty('x') && points[0].hasOwnProperty('y')){
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; ++i) ctx.lineTo(points[i].x, points[i].y);
            } else {
                ctx.moveTo(points[0][0], points[0][1]);
                for (let i = 1; i < points.length; ++i) ctx.lineTo(points[i][0], points[i][1]);
            }
        }
    },

    pathClosedShape(ctx, points){
        if(points.length) this.pathShape(ctx, points.concat([points[0]]));
    },

    blendColor(ctx, color, alpha = 1.0, globalCompositeOperation = 'source-over'){
        ctx.save();
        ctx.globalCompositeOperation = globalCompositeOperation;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
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

    // Set operations
    isSuperset(set, subset) {
        for (const elem of subset) {
            if (!set.has(elem)) return false;
        }
        return true;
    },
      
    setsUnion(setA, setB) {
        let union = new Set(setA);
        for (const elem of setB) {
            union.add(elem);
        }
        return union;
    },

    setsIntersection(setA, setB) {
        let intersection = new Set();
        for (const elem of setB) {
            if (setA.has(elem)) intersection.add(elem);
        }
        return _intersection;
    },

    setsSymmetricDifference(setA, setB) {
        let difference = new Set(setA);
        for (const elem of setB) {
            if (difference.has(elem)) difference.delete(elem);
            else difference.add(elem);
        }
        return difference;
    },

    setsDifference(setA, setB) {
        let difference = new Set(setA);
        for (const elem of setB) difference.delete(elem);
        return difference;
    },

    // Misc
    isStrictMode(){
        return ((eval("var __temp = null"), (typeof __temp === "undefined")) ? "strict":  "non-strict");
    },

    getKeys(dict){
        let keys = [];
        for(let key in dict) keys.push(key);
        return keys;
    },

    getValues(dict){
        let values = [];
        for(let key in dict) values.push(dict[key]);
        return values;
    },

    addMultipleEventListener(element, events, handler) {
        events.forEach(e => element.addEventListener(e, handler))
    }
};

},{}]},{},[14])