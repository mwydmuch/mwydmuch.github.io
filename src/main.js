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
const Sorting = require("./sorting");
const Cardioids = require("./cardioids");
const Utils = require("./utils");

// Globals
// ---------------------------------------------------------------------------------------------------------------------

const canvas = document.getElementById("background");
const container = document.getElementById("container");
var lastWidth = 0;
var lastHeight = 0;
var needResize = false;
var framesInterval = 0;
var then = 0;
var stopped = false;

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

const colors = [ // Green palette
    "#349BA9",
    "#41B8AD",
    "#73D4AD",
    "#AEEABF",
    "#73D4AD",
    "#41B8AD",
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
    "#a4f540",
    "#106aa6",
    "#283b93",
];


// Get controls
// ---------------------------------------------------------------------------------------------------------------------

const content = document.getElementById("content");
const backgroundShow = document.getElementById("background-show");
const backgroundName = document.getElementById("background-name");
const backgroundNext = document.getElementById("background-next");
const backgroundCode = document.getElementById("background-code");
const backgroundReset = document.getElementById("background-reset");
const backgroundStop = document.getElementById("background-stop");


// Create animation and init animation loop
// ---------------------------------------------------------------------------------------------------------------------

let animations = [
    GameOfLife,
    PerlinNoiseParticles,
    SpinningShapes,
    NeuralNetwork,
    ThreeNPlusOne,
    CircularWaves,
    ParticlesVortex,
    ParticlesAndAttractors,
    GradientDescent,
    Sorting,
    Cardioids,
];

Utils.randomShuffle(animations);

let animationId = 0;
let animation = new animations[animationId](canvas, colors, colorsAlt);

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
    if(stopped) return;

    const now = Date.now(),
          timeElapsed = now - then;

    // Limit framerate
    requestAnimationFrame(render);
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
    backgroundStop.innerHTML = "<i class=\"fas fa-stop\"></i> stop";
    stopped = false;
    then = Date.now();
    render();
}

if(backgroundShow && content) {
    backgroundShow.addEventListener("click", function () {
        if (backgroundShow.innerText == " show") {
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
}

if(backgroundNext) {
    backgroundNext.addEventListener("click", function () {
        animationId = (animationId + 1) % animations.length;
        animation = new animations[animationId](canvas, colors, colorsAlt);
        updateAnimation(animation);
        play();
    });
}

if(backgroundReset) {
    backgroundReset.addEventListener("click", function () {
        animation = new animations[animationId](canvas, colors, colorsAlt);
        updateAnimation(animation);
        play();
    });
}

if(backgroundStop) {
    backgroundStop.addEventListener("click", function () {
        if (backgroundStop.innerText == " stop") {
            stopped = true;
            backgroundStop.innerHTML = "<i class=\"fas fa-play\"></i> play";
        } else {
            play();
        }
    });
}
