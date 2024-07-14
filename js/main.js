'use strict';

// TODO: Refactor/wrap this code into animation/background controller class/module

// Require
// ---------------------------------------------------------------------------------------------------------------------

const Utils = require("./utils");

const ThreeNPlusOne = require("./animations/3n+1"),
      BriansBrainAutomata = require("./animations/brians-brain-automata"),
      Cardioids = require("./animations/cardioids"),
      CircularWaves = require("./animations/circular-waves"),
      Coding = require("./animations/coding"),
      DayAndNightAutomata = require("./animations/day-and-night-automata"),
//      FiguresSpiral = require("./animations/figures-spiral"),
      GameOfLife = require("./animations/game-of-life"),
      GameOfLifeIsometric = require("./animations/game-of-life-isometric"),
      GlitchAutomata = require("./animations/glitch-automata"),
      GradientDescent = require("./animations/gradient-descent"),
      Matrix = require("./animations/matrix"),
      MLinPL = require("./animations/mlinpl"),
      Network = require("./animations/network"),
//     NeuralNetwork = require("./animations/neural-network"),
      NoisyLines = require("./animations/noisy-lines"),
      ParticlesAndAttractors = require("./animations/particles-and-attractors"),
      ParticlesVortex = require("./animations/particles-vortex"),
      ParticlesWaves = require("./animations/particles-waves"),
      PerlinNoiseParticles = require("./animations/perlin-noise-particles"),
      RockPaperScissorsAutomata = require("./animations/rock-paper-scissors-automata"),
      SandAutomata = require("./animations/sand-automata"),
      Quadtree = require("./animations/quadtree"),
      RecursiveSquares = require("./animations/recursive-squares"),
      ShortestPath = require("./animations/shortest-path"),
      SineWaves = require("./animations/sine-waves"),
      Sorting = require("./animations/sorting"),
      SpinningShapes = require("./animations/spinning-shapes"),
      Spirograph = require("./animations/spirograph"),
      Vectors = require("./animations/vectors");
//const TreeVisualization = require("./animations/tree-visualization");


// Globals
// ---------------------------------------------------------------------------------------------------------------------

let fps = 30,
    framesInterval = 1000 / fps,
    then = 0,
    paused = false,
    width = 0,
    height = 0,
    lastWidth = 0,
    lastHeight = 0,
    resolution = "fit",
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

const canvas = document.getElementById("background"),
      container = document.getElementById("background-container"),
      content = document.getElementById("me"),
      elemBgShow = document.getElementById("background-show"),
      elemBgName = document.getElementById("background-name"),
      elemBgDesc = document.getElementById("background-description"),
      elemBgPrev = document.getElementById("background-previous"),
      elemBgNext = document.getElementById("background-next"),
      elemBgCode = document.getElementById("background-code"),
      elemBgReset = document.getElementById("background-reset"),
      elemBgRestart = document.getElementById("background-restart"),
      elemBgPlayPause = document.getElementById("background-play-pause"),
      elemBgSettings = document.getElementById("background-settings"),
      elemBgSettingsControls = document.getElementById("background-settings-controls"),
      elemBgSettingsClose = document.getElementById("background-settings-close"),
      elemBgStats = document.getElementById("background-stats"),
      elemBgAnimationSelect = document.getElementById("background-settings-animation-select"),
      elemBgAnimationFps = document.getElementById("background-settings-animation-fps"),
      elemBgAnimationResolution = document.getElementById("background-settings-animation-resolution"),
      elemBgColor = document.getElementById("background-settings-bg-color");

      
if(canvas){
    
    // Create the initial animation and initiate the animation loop
    // ---------------------------------------------------------------------------------------------------------------------

    let animations = [
        {class: ThreeNPlusOne, name: "3n+1"},
        {class: BriansBrainAutomata, name: "brian's brain automata"},
        {class: Cardioids, name: "cardioids"},
        {class: CircularWaves, name: "circular waves"},
        {class: Coding, name: "coding"},  // Disabled till finished
        {class: DayAndNightAutomata, name: "day and night automata"},
        //{class: FiguresSpiral, name: "figures spiral"},  // Disabled since it's not that interesting
        {class: GameOfLife, name: "game of life"},
        {class: GameOfLifeIsometric, name: "isometric game of life"},
        {class: GlitchAutomata, name: "glitch automata", startAnimation: false},  // Disable as a start animation, as it may not be visually pleasing for everyone
        {class: GradientDescent, name: "gradient descent"},
        {class: Matrix, name: "matrix rain"},
        {class: MLinPL, name: "ml in pl"},
        {class: Network, name: "network"},
        //{class: NeuralNetwork, name: "neural network"}, // Disabled till updated
        {class: NoisyLines, name: "noisy lines"},
        {class: ParticlesAndAttractors, name: "particles and attractors"},
        {class: ParticlesVortex, name: "particles vortex"},
        {class: ParticlesWaves, name: "particles waves"},
        {class: PerlinNoiseParticles, name: "perlin noise"},
        {class: RockPaperScissorsAutomata, name: "rock-paper-scissors automata"},
        {class: SandAutomata, name: "sand automata"},
        {class: Quadtree, name: "quadtree", startAnimation: false}, // Disable as a start animation since it resources heavy
        {class: RecursiveSquares, name: "recursive squares", startAnimation: false}, // Disable as a start animation since it resources heavy
        {class: SineWaves, name: "sine waves"},
        {class: ShortestPath, name: "shortest path"},
        {class: Sorting, name: "sorting"},
        {class: SpinningShapes, name: "spinning shapes"},
        {class: Spirograph, name: "spirograph"},
        //{class: Vectors, name: "vectors"}, // Disabled cause it is not ready
        //{class: TreeVisualization, name: "tree visualization"}, // Disabled cause it is not ready
    ];

    // Define functions related to the animation loop and control
    // ---------------------------------------------------------------------------------------------------------------------

    function getTime(){
        return Date.now();
        //return window.performance.now(); // Alternative method for measruing time
    }

    function updateAnimation(newAnimationId, newAnimationSettings = null) {
        frames = 0;
        avgDrawTime = 0;
        avgElapsedTime = 0;
        animationId = newAnimationId;
        animation = new animations[animationId].class(canvas, colors, colorsAlt, bgColor);
        if(newAnimationSettings) animation.setSettings(newAnimationSettings);
        then = getTime();
        trueThen = then;
        animation.resize();
        updateUI();
    }

    function updateAnimationResolution(sizeStr) {
        resolution = sizeStr;
        if(sizeStr !== "fit") {
            fixedWidth = parseInt(resolution.split("x")[0]);
            fixedHeight = parseInt(resolution.split("x")[1]);
            canvas.classList.add("fixed-size");
        }
        else canvas.classList.remove("fixed-size");
    }

    function updateAnimationFps(fpsStr) {
        fps = parseInt(fpsStr);
        framesInterval = 1000 / fps;
    }

    function checkResize() {
        // Detect the change of container's size for smooth resizing
        if(resolution === "fit"){
            width = Math.max(container.parentElement.offsetWidth - canvas.offsetLeft);
            height = Math.max(container.parentElement.offsetHeight - canvas.offsetTop);
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
                                        avg. draw time: ${Math.round(avgDrawTime)} ms`;
                                        //`</br> possible fps: ${Math.round(1000 / avgDrawTime)}`;
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


    // Initialize the animation

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
    if(urlParams.has("resolution")) updateAnimationResolution(urlParams.get("resolution"));
    if(urlParams.has("fps")) updateAnimationFps(urlParams.get("fps"));
    if(urlParams.has("bgColor")) bgColor = urlParams.get("bgColor");

    let animation = null,
        order = Array.from({length: animationCount}, (x, i) => i);

    Utils.randomShuffle(order);
    for(let i = 0; i < animationCount; ++i){
        animations[order[i]].prev = order[(i + animationCount - 1) % animationCount];
        animations[order[i]].next = order[(i + 1) % animationCount];
    }

    updateAnimation(animationId, urlParams);
    render();


    // Support for mouse click
    // ---------------------------------------------------------------------------------------------------------------------

    function getRelativeCursorPosition(elem, e) {
        if(e.touches) e = e.touches[0];
        const rect = elem.getBoundingClientRect(),
              x = (e.clientX - rect.left) / (rect.right - rect.left) * elem.width,
              y = (e.clientY - rect.top) / (rect.bottom - rect.top) * elem.height;
        return {x: x, y: y};
    }

    let eventNames = {
        "click": "click",
        "mousedown": "down",
        "touchstart": "down",
        "mousemove": "move",
        "touchmove": "move",
        "mouseup": "up",
        "touchend": "up",
    };

    ["click", "mousedown", "touchstart", "mousemove", "touchmove", "mouseup", "touchend"].forEach(function(eventName){
        canvas.addEventListener(eventName, function (e) {
            const cords = getRelativeCursorPosition(canvas, e);
            animation.mouseAction(getRelativeCursorPosition(canvas, e), eventNames[eventName]);
        })
    });


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

    function buildOptionList(options, selected){
        let optionsList = "",
            selectedFound = false;
        for(let opt of options) {
            optionsList += "<option ";
            if (opt === selected) {
                optionsList += "selected ";
                selectedFound = true;
            }
            optionsList += `value="${opt}">${opt}</option>`;
        }
        if(!selectedFound) optionsList += `<option selected value="${selected}">custom (${selected})</option>`;
        return optionsList;
    }

    // Animation canvas size options
    if(elemBgAnimationResolution) {
        const animationSizes = ["fit", "512x512", "800x600", "1024x768", "1024x1024", "1280x720","1600x1200", "1920x1080", "2048x2048"];
        elemBgAnimationResolution.innerHTML = buildOptionList(animationSizes, resolution);
        elemBgAnimationResolution.addEventListener("input", function (e) {
            updateAnimationResolution(e.target.value)
        });
    }

    // Animation FPS option
    if(elemBgAnimationFps) {
        const fpsOptions = [15, 30, 60];
        elemBgAnimationFps.innerHTML = buildOptionList(fpsOptions, fps);
        elemBgAnimationFps.addEventListener("input", function (e) {
            updateAnimationFps(e.target.value);
        });
    }

    // Background color
    if(elemBgColor) {
        elemBgColor.innerHTML = '<option value="#FFFFFF" selected>white</option><option value="#000000">black</option>';
        elemBgColor.addEventListener("input", function (e) {
            bgColor = e.target.value;
            animation.updateColors(colors, colorsAlt, bgColor);
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

        function setMaxHeight(){
            elemBgSettingsControls.style.maxHeight = elemBgSettingsControls.parentNode.offsetHeight - parseInt(elemBgSettingsControls.style.top) + 'px';
        }

        function checkIfFits(){
            if(elemBgSettingsControls.parentNode.offsetWidth < 376)
                elemBgSettingsControls.style.left = '0px';
        }

        checkIfFits();
        setMaxHeight();
        
        // Show/hide the background settings panel
        elemBgSettings.addEventListener("click", function () {
            if (elemBgSettingsControls.classList.contains("fade-out") || 
                elemBgSettingsControls.style.display === "none") showSettings();
            else closeSettings();
        });

        elemBgSettingsClose.addEventListener("click", function () {
            closeSettings();
        });

        // Events for dragging the background settings panel
        ["mousedown", "touchstart"].forEach(function(eventName){
            elemBgSettingsControls.addEventListener(eventName, function (e) {
                if(e.target !== e.currentTarget) return;
                if(e.touches) e = e.touches[0];
                e.target.classList.add('moving');
                e.target.clickAnchorX = e.clientX - parseInt(e.target.style.left);
                e.target.clickAnchorY = e.clientY - parseInt(e.target.style.top);
            })
        });

        ["mousemove", "touchmove"].forEach(function(eventName){
            addEventListener(eventName, function (e) {
                if(elemBgSettingsControls.classList.contains('moving')){
                    if(e.touches) e = e.touches[0];
                    let leftPos = e.clientX - elemBgSettingsControls.clickAnchorX,
                        topPos = e.clientY - elemBgSettingsControls.clickAnchorY;

                    if(leftPos < 0) leftPos = 0;
                    if(topPos < 0) topPos = 0;

                    elemBgSettingsControls.style.left = leftPos + 'px';
                    elemBgSettingsControls.style.top = topPos + 'px';
                    setMaxHeight();
                }
            })
        });

        ["mouseup", "touchend"].forEach(function(eventName){
            addEventListener(eventName, function (e) {
                elemBgSettingsControls.classList.remove('moving');
            })
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
            // Internal urls
            {
                replaceStr: urlReplaceStrFormat('\$1', '\$3', '\$2', '\$4'), 
                regexp: /(.*)\[(.*)\]\((https?:\/\/(?:www\.)?mwydmuch\.pl\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))\)(.*)/g
            },
            // Other Markdown urls
            {
                replaceStr: urlReplaceStrFormat('\$1', '\$3', '<i class="fas fa-link"></i> \$2', '\$4'),
                regexp: /(.*)\[(.*)\]\((https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))\)(.*)/g
            },
            // Lose urls
            {
                replaceStr: urlReplaceStrFormat('\$1', '\$2', '<i class="fas fa-link"></i> \$2', '\$3'),
                regexp: /(.*)[^"](https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))[^"](.*)/g
            },
        ]

        for(let r of regexpToReplace){
            description = description.replaceAll(r.regexp, r.replaceStr);
        }

        // Replace ^- with </br>-
        description = description.replaceAll("\n- ", "</br>- ");

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
                if (setting.type === "separator"){
                    elemBgSettingsList.innerHTML += '<div class="setting-separator"></div>';
                    return;
                }

                const value = eval(`animation.${setting.prop}`),
                      elemId = getPropId(setting.prop) + "-controls";
                
                let name = getPropId(setting.prop).replaceAll('-', ' ');
                if (setting.name) name = setting.name;

                let optionControls = `<div><span class="setting-name">${name}</span><span class="nowrap setting-value-control">`;

                if(["int", "float", "bool"].includes(setting.type)) {
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
                else if(setting.type === "select") {
                    optionControls += `<select class="form-select setting-select" name="${setting.prop}" id="${elemId}">`;
                    for(let v of setting['values']) {
                        if(v === value) optionControls += `<option selected value="${v}">${v}</option>`;
                        else optionControls += `<option value="${v}">${v}</option>`;
                    }
                    optionControls += "</select>";
                }
                else if(setting.type === "text") optionControls += `<span class="setting-text">${setting.value.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>`;
                optionControls += "</span></div>";
                elemBgSettingsList.innerHTML += optionControls;
            });

            // Add events
            settings.forEach(function(setting, index) {
                if (["text", "separator"].includes(setting.type)) return;

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