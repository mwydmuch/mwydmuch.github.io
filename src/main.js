'use strict';

// Require
// ---------------------------------------------------------------------------------------------------------------------

const GameOfLife = require("./gameoflive");
const PerlinNoise = require("./perlinnoise");


// Globals
// ---------------------------------------------------------------------------------------------------------------------

var canvas = document.getElementById("background");
var container = document.getElementById("container");
var lastWidth = 0;
var lastHeight = 0;
var needResize = false;

var fps = 15; // Due to performance concerns, run all the animations at 15 frames per second
var fpsInterval = 1000 / fps;
var then = Date.now();

// var colors = [ // Green
//     "#678786",
//     "#92ABA1",
//     "#A5BFBC",
//     "#C5D1D2"
// ]

var colors = [ // Grey
    "#777777",
    "#888888",
    "#999999",
    "#AAAAAA"
]


// Create animation and init animation loop
// ---------------------------------------------------------------------------------------------------------------------

var animations = [
    GameOfLife,
    PerlinNoise
]

//var animation = new GameOfLife(canvas, colors);
//var animation = new PerlinNoise(canvas, colors);
var animation = new animations[Math.floor(Math.random() * animations.length)](canvas, colors);

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
