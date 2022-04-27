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
const elemBgStop = document.getElementById("background-stop");
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
    animation.resize();

    if(elemBgSettingsControls) {
        let settings = animation.getSettings();
        let bgSetList = document.getElementById("background-settings-controls-list")
        bgSetList.innerHTML = "";

        if(settings.length == 0)
            bgSetList.innerHTML = "No settings";

        // Create settings controls
        settings.forEach(function(setting, index) {
            let prop = setting["prop"];
            let value = animation[prop];
            let elemId = prop.split(/(?=[A-Z])/).join('-').toLowerCase() + "-controls";
            let name = prop.split(/(?=[A-Z])/).join(' ').toLowerCase();

            let optionControls = '<div><span class="setting-name">' + name + ' = </span>'
            if(setting['type'] === 'int') {
                optionControls +=
                    '<input type="range" class="setting-input" name="' + prop +
                    '" id="' + elemId + '" value="' + value +
                    '" min="' + setting["min"] + '" max="' + setting["max"] +
                    '" onInput="this.nextElementSibling.value = this.value">' +
                    '[<output class="setting-value">' + value + '</output>]';
            }
            optionControls += "</div>";
            bgSetList.innerHTML += optionControls;
        });

        // Add events
        settings.forEach(function(setting, index) {
            let prop = setting["prop"];
            let elemId = prop.split(/(?=[A-Z])/).join('-').toLowerCase() + "-controls";
            let reqResize = setting["requires_resize"];
            let elem = document.getElementById(elemId);
            if(elem)
                elem.addEventListener("click", function (e) {
                    animation[prop] = e.target.value;
                    if (reqResize) animation.resize();
                });
        });
    }
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
    elemBgStop.innerHTML = "<i class=\"fas fa-stop\"></i> stop";
    stopped = false;
    then = Date.now();
    render();
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

if(elemBgStop) {
    elemBgStop.addEventListener("click", function () {
        if (elemBgStop.innerText == " stop") {
            stopped = true;
            elemBgStop.innerHTML = "<i class=\"fas fa-play\"></i> play";
        } else {
            play();
        }
    });
}

if(elemBgSettings && elemBgSettingsControls && elemBgSettingsClose) {
    function closeSettings(){
        elemBgSettingsControls.classList.remove("fade-in");
        elemBgSettingsControls.classList.add("fade-out");
        //elemBgSettings.innerHTML = "<i class=\"fas fa-cog\"></i> show settings";
    }

    function showSettings(){
        elemBgSettingsControls.classList.remove("fade-out");
        elemBgSettingsControls.classList.add("fade-in");
        elemBgSettingsControls.style.display = "block";
        //elemBgSettings.innerHTML = "<i class=\"fas fa-cog\"></i> close settings";
    }

    // Show/hide the background settings window
    elemBgSettings.addEventListener("click", function () {
        if (elemBgSettingsControls.classList.contains("fade-in")) closeSettings();
        else showSettings();
    });

    elemBgSettingsClose.addEventListener("click", function () {
        closeSettings();
    });

    // Events for dragging the background settings windows
    elemBgSettingsControls.addEventListener('mousedown', function (e) {
        if(e.target !== e.currentTarget) return;
        e.target.classList.add('moving');
    });

    addEventListener('mousemove', function (e) {
        if(elemBgSettingsControls.classList.contains('moving')){
            elemBgSettingsControls.style.left = e.clientX + 'px';
            elemBgSettingsControls.style.top = e.clientY  + 'px';
        }
    });

    addEventListener('mouseup', function (e) {
        elemBgSettingsControls.classList.remove('moving');
    });
}
