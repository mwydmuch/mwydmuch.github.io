'use strict';

// Require
// ---------------------------------------------------------------------------------------------------------------------

const GameOfLife = require("./game-of-live");
const PerlinNoiseParticles = require("./perlin-noise-particles");
const SpinningShapes = require("./spinning-shapes");
const NeuralNetwork = require("./neural-network");


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
    NeuralNetwork
]

//const animation = new GameOfLife(canvas, colors);
//const animation = new PerlinNoiseParticles(canvas, colors);
//const animation = new SpinningShapes(canvas, colors);
//const animation = new NeuralNetwork(canvas, colors);
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
