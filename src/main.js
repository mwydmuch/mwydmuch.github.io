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
    "#CA3737",
];


// Create animation and init animation loop
// ---------------------------------------------------------------------------------------------------------------------

const content = document.getElementById("content");
const backgroundControls = document.getElementById("background-controls");
const backgroundName = document.getElementById("background-name");
const backgroundNext = document.getElementById("background-next");
const backgroundCode = document.getElementById("background-code");

const animations = [
    GameOfLife,
    PerlinNoiseParticles,
    SpinningShapes,
    NeuralNetwork,
    ThreeNPlusOne,
    CircularWaves,
    ParticlesVortex,
    ParticlesAndAttractors,
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

backgroundControls.addEventListener("mouseover", function(){
    content.classList.remove("show-from-0");
    content.classList.add("fade-to-0");
    canvas.classList.remove("faded-8");
    canvas.classList.remove("fade-to-8");
    canvas.classList.add("hue-change");
    canvas.classList.add("show-from-8");
});

backgroundControls.addEventListener("mouseout", function(){
    content.classList.remove("fade-to-0");
    content.classList.add("show-from-0");
    canvas.classList.remove("show-from-8");
    canvas.classList.add("fade-to-8");
    canvas.classList.remove("hue-change");
});

backgroundNext.addEventListener("click", function(){
    animationId = (animationId + 1) % animations.length;
    animation = new animations[animationId](canvas, colors, colorsAlt);
    updateAnimation(animation);
});
