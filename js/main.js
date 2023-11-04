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
const NoisyLines = require("./noisy-lines");
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
const TreeVisualization = require("./tree-visualization");


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

const bgColors = {
    "black": "#000000", 
    "white": "#FFFFFF"
};
let bgColor = "#FFFFFF";

let colors = [ // Green palette
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

let colorsAlt = [ // Alt palette
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
const elemBgColor = document.getElementById("background-settings-bg-color");

if(canvas){

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
        {class: MLinPL, name: "mlinpl"},
        {class: Network, name: "network"},
        //{class: NeuralNetwork, name: "neural network"}, // Disabled till updated
        {class: NoisyLines, name: "noisy lines"},
        {class: ParticlesAndAttractors, name: "particles and attractors"},
        {class: ParticlesVortex, name: "particles vortex"},
        {class: ParticlesWaves, name: "particles waves"},
        {class: PerlinNoiseParticles, name: "perlin noise"},
        {class: RockPaperScissorsAutomata, name: "rock-paper-scissors automata"},
        {class: SandAutomata, name: "sand automata"},
        {class: Quadtree, name: "quadtree", startAnimation: false}, // Disable this as a start animation since it resurces heavy
        {class: RecursiveRectangles, name: "recursive rectangles", startAnimation: false}, // Disable this as a start animation since it resurces heavy
        {class: ShortestPath, name: "shortest path"},
        {class: Sorting, name: "sorting"},
        {class: SpinningShapes, name: "spinning shapes"},
        {class: Spirograph, name: "spirograph"},
        {class: SineWaves, name: "sine waves"},
        //{class: TreeVisualization, name: "tree visualization"}, // Disabled cause it is not ready
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
        animation = new animations[animationId].class(canvas, colors, colorsAlt, bgColor);
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
                elemBgStats.innerHTML = `canvas resolution: ${canvas.width} x ${canvas.height}</br>
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
        
        // Stop animation when tab is not visible to save resources
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
    // ---------------------------------------------------------------------------------------------------------------------

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
        const animationSizes = ["fit", "512x512", "800x600", "1024x768", "1024x1024", "1280x720","1600x1200", "1920x1080", "2048x2048"];
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
                canvas.classList.add("fixed-size");
            }
            else canvas.classList.remove("fixed-size");
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

    // Background color
    if(elemBgColor) {
        elemBgColor.innerHTML = '<option value="#FFFFFF" selected>white</option><option value="#000000">black</option>';
        elemBgColor.addEventListener("input", function (e) {
            bgColor = e.target.value;
            animation.bgColor = e.target.value;
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

} // if(canvas)