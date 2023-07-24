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