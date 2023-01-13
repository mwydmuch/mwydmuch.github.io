'use strict';

// TODO: Refactor/wrap this code into animation/background controller class/module

// Require
// ---------------------------------------------------------------------------------------------------------------------

const Utils = require("./utils");

const ThreeNPlusOne = require("./3n+1");
const Cardioids = require("./cardioids");
const CircularWaves = require("./circular-waves");
const GameOfLife = require("./game-of-life");
const GameOfLifeIsometric = require("./game-of-life-isometric");
const GradientDescent = require("./gradient-descent");
const Matrix = require("./matrix");
const Network = require("./network");
const NeuralNetwork = require("./neural-network");
const ParticlesAndAttractors = require("./particles-and-attractors");
const ParticlesVortex = require("./particles-vortex");
const ParticlesWaves = require("./particles-waves");
const PerlinNoiseParticles = require("./perlin-noise-particles");
const Quadtree = require("./quadtree");
const ShortestPath = require("./shortest-path");
const SineWaves = require("./sine-waves");
const Sorting = require("./sorting");
const SpinningShapes = require("./spinning-shapes");
const Spirograph = require("./spirograph");


// Globals
// ---------------------------------------------------------------------------------------------------------------------

const canvas = document.getElementById("background");
const container = document.getElementById("container");
let framesInterval = 0,
    then = 0,
    paused = false,
    width = 0,
    height = 0,
    lastWidth = 0,
    lastHeight = 0,
    resizeMode = "fit",
    fixedWidth = 512,
    fixedHeight = 512;

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


// Get elements controls
// ---------------------------------------------------------------------------------------------------------------------

const content = document.getElementById("content");
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


// Create animation and init animation loop
// ---------------------------------------------------------------------------------------------------------------------

let animations = [
    {class: ThreeNPlusOne, name: "3n+1"},
    {class: Cardioids, name: "cardioids"},
    {class: CircularWaves, name: "circular waves"},
    {class: GameOfLife, name: "game of life"},
    {class: GameOfLifeIsometric, name: "isometric game of life"},
    {class: GradientDescent, name: "gradient descent"},
    {class: Matrix, name: "matrix rain"},
    {class: Network, name: "network"},
    //{class: NeuralNetwork, name: "neural network"},
    {class: ParticlesAndAttractors, name: "particles and attractors"},
    {class: ParticlesVortex, name: "particles vortex"},
    {class: ParticlesWaves, name: "particles waves"},
    {class: PerlinNoiseParticles, name: "perlin noise"},
    {class: Quadtree, name: "quadtree"},
    {class: ShortestPath, name: "shortest path"},
    {class: Sorting, name: "sorting"},
    {class: SpinningShapes, name: "spinning shapes"},
    {class: Spirograph, name: "spirograph"},
    {class: SineWaves, name: "sine waves"}
];

const animationCount = animations.length;
let animationId = Utils.randomInt(0, animationCount),
    animation = null,
    order = Array.from({length: animationCount}, (x, i) => i);

Utils.randomShuffle(order);
for(let i = 0; i < animationCount; ++i){
    animations[order[i]].prev = order[(i + animationCount - 1) % animationCount];
    animations[order[i]].next = order[(i + 1) % animationCount];
}

// Get animation from url search params
const urlParams = new URLSearchParams(window.location.search);
if(urlParams.has("animation")){
    const animationParam = urlParams.get("animation").replaceAll("-", " ");
    for(let i = 0; i < animationCount; ++i){
        if(animationParam === animations[i].name) animationId = i;
    }
}

function updateAnimation(newAnimationId) {
    animationId = newAnimationId;
    animation = new animations[animationId].class(canvas, colors, colorsAlt);
    let fps = animation.getFPS();
    framesInterval = 1000 / fps;
    then = Date.now();
    animation.resize();
    updateUI();
}


function checkResize() {
    // Detect container size change here for smooth resizing
    width = Math.max(container.offsetWidth, window.innerWidth - canvas.offsetLeft);
    height = Math.max(container.offsetHeight, window.innerHeight - canvas.offsetTop);
    if(resizeMode === "fit"){
        if(width !== lastWidth || height !== lastHeight){
            canvas.width = width;
            canvas.height = height;
            animation.resize();
        } 
    } else {
        if(canvas.width !== fixedWidth || height !== fixedHeight){
            canvas.width = fixedWidth;
            canvas.height = fixedHeight;
            animation.resize();
        } 
        if(width !== lastWidth || height !== lastHeight){
            canvas.style.top = `${(height - fixedHeight) / 2}px`;
            canvas.style.left = `${(width - fixedWidth) / 2}px`;
        }
    }

    lastHeight = height;
    lastWidth = width;
}

function render() {
    if(paused) return;

    const now = Date.now(),
          timeElapsed = now - then;

    // Limit framerate
    requestAnimationFrame(render);
    if (timeElapsed <= framesInterval) return;
    then = now;

    checkResize();

    animation.update(timeElapsed);
    animation.draw();

    if(elemBgStats) {
        elemBgStats.innerHTML = `frame time: ${timeElapsed}</br>
                                fps: ${Math.round(1000 / timeElapsed)}</br>
                                canvas size: ${width} x ${height}`;
    }
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
        canvas.classList.add("fade-to-10");
        elemBgShow.innerHTML = "<i class=\"fas fa-eye\"></i> show";
    }

    function showBackground(){
        content.classList.remove("fade-in");
        content.classList.add("fade-out");
        canvas.classList.remove("faded-10");
        canvas.classList.remove("fade-to-10");
        canvas.classList.add("show-from-10");
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

    // Animation selection option
    elemBgAnimationSelect.addEventListener("input", function (e) {
        updateAnimation(parseInt(e.target.value));
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

function processDescription(description){
    // Replace new lines \n with </br>
    description = description.trim().replaceAll("\n\n", "</p><p>");
    description = '<p>' + description + '</p>';

    // Wrap urls into <a> tag
    const urlRegex = /(.*)(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))(.*)/g
    description = description.replaceAll(urlRegex, '\$1<a href="\$2">\$2</a>\$3');
    return description;
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
                elemId = setting.prop.split(/(?=[A-Z])/).join('-').toLowerCase() + "-controls",
                name = setting.prop.split(/(?=[A-Z])/).join(' ').toLowerCase();

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
            const elemId = setting.prop.split(/(?=[A-Z])/).join('-').toLowerCase() + "-controls";
            let elem = document.getElementById(elemId);
            if(elem) {
                elem.addEventListener("input", function (e) {
                    if (e.target.type === "checkbox") {
                        if (e.target.parentNode.nextElementSibling.type === "output")
                            e.target.parentNode.nextElementSibling.value = e.target.checked;
                        eval(`animation.${setting.prop} = e.target.checked;`);
                    } else {
                        if(e.target.nextElementSibling.type === "output") e.target.nextElementSibling.value = e.target.value;
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
