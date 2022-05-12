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
const Matrix = require("./matrix");
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
    Matrix,
    NeuralNetwork,
    ParticlesAndAttractors,
    ParticlesVortex,
    ParticlesWaves,
    PerlinNoiseParticles,
    Sorting,
    SpinningShapes,
    Spirograph,
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

                optionControls += `<span class="nowrap"><input type="${inputType}" class="setting-input"` +
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
            optionControls += "</span></div>";
            elemBgSettingsList.innerHTML += optionControls;
        });

        // Add events
        settings.forEach(function(setting, index) {
            const elemId = setting.prop.split(/(?=[A-Z])/).join('-').toLowerCase() + "-controls";
            let elem = document.getElementById(elemId);
            if(elem) {
                elem.addEventListener("input", function (e) {
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
