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
