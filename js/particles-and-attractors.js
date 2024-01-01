'use strict';

const NAME = "system of particles and attractors",
      FILE = "particles-and-attractors.js",
      DESC = `
Very simple particle system with attractors.
In this system, distance and momentum are ignored.
The new velocity vector of a particle is calculated as the sum of angles
between the particle and all attractors.
Because the velocity does not depend on the distance to the attractors,
and momentum is not preserved, the particles are not "catapulted" away from the attractors.
This results in a system that is mesmerizing to watch.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class ParticlesAndAttractors extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor,
                 numParticles= 10000,
                 particlesSpeed = "random",
                 fadingSpeed = 0.03,
                 numAttractors = "random",
                 centralAttractor = "random",
                 attractorsSystem = "random",
                 attractorsSpeed = "random",
                 drawAttractors = false,
                 scale = 1,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.particles = []
        this.numParticles = numParticles;
        this.particlesSpeed = this.assignIfRandom(particlesSpeed, Utils.round(Utils.randomRange(0.25, 0.5)));
        this.fadingSpeed = fadingSpeed;
        this.nextFadeStep = 0;
        
        this.attractors = [];
        this.drawAttractors = drawAttractors;
        this.numAttractors = this.assignIfRandom(numAttractors, Utils.randomInt(3, 7));
        this.centralAttractor = this.assignIfRandom(centralAttractor, Utils.randomChoice([false, true]));
        this.attractorsSystems = ["orbits", "eights", "circle"];
        this.attractorsSystem = this.assignIfRandom(attractorsSystem, Utils.randomChoice(this.attractorsSystems));
        this.attractorsSpeed = this.assignIfRandom(attractorsSpeed, Utils.round(Utils.randomRange(0.05, 0.1) * Utils.randomChoice([-1, 1])));
        this.attractorsPosition = 0;
        this.startingPosition = Utils.randomRange(0, 10);
        this.directionScale = 1;

        this.scale = scale;
        this.rainbowColors = rainbowColors;

        this.mouseDown = false;
        this.mouseAttractor = {x: 0, y: 0};

        this.setup();
    }

    setup(){
        this.particles = []
        for (let i = 0; i < this.numParticles; ++i)
            this.particles.push(Utils.rotateVec2d({
                x: Utils.randomRange(1, 100, this.rand),
                y: 0,
                prevX: 0,
                prevY: 0,
            }, i));
    }

    update(elapsed){
        super.update(elapsed);
        this.nextFadeStep = this.fadingSpeed * elapsed / 33;

        this.attractorsPosition += elapsed / 1000 * this.attractorsSpeed;

        const pos = this.startingPosition + this.attractorsPosition,
        numA = this.numAttractors + 1 - this.centralAttractor,
        startI = 1 - this.centralAttractor

        // Calculate positions of attractors
        this.attractors = [];
        if(this.attractorsSystem === "orbits") {
            const r = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / (2 * (this.numAttractors - 1));
            for (let i = startI; i < numA; ++i)
                this.attractors.push(Utils.rotateVec2d(Utils.createVec2d(i * r, 0), pos * i));
        } else if (this.attractorsSystem === "eights") {
            const r = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / this.numAttractors;
            for (let i = startI; i < numA; ++i)
                this.attractors.push(Utils.rotateVec2d(Utils.createVec2d(i * Math.sin(pos * Math.PI / 2) * r, 0), pos * i));
        } else if (this.attractorsSystem === "circle") {
            if(this.centralAttractor) this.attractors.push({x: 0, y: 0});
            const r = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) * 0.4;
            for (let i = 1; i < numA; ++i)
                this.attractors.push(Utils.rotateVec2d(Utils.createVec2d(r, 0), (pos + i) * 2 * Math.PI / (numA - 1)));
        }
        if(this.mouseDown) this.attractors.push(this.mouseAttractor);

        for (let p of this.particles) {
            let d = 0

            // Calculate direction of velocity vector for each particle
            for (let a of this.attractors) d += Math.atan2(a.y - p.y, a.x - p.x) * this.directionScale;

            // Calculate new position of the particle
            p.prevX = p.x;
            p.prevY = p.y;
            p.x += Math.cos(d) * this.particlesSpeed * elapsed;
            p.y += Math.sin(d) * this.particlesSpeed * elapsed;
        }
    }

    draw() {
        this.fadeOut(this.nextFadeStep);

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);

        const color = this.rainbowColors ? `hsl(${this.time / 5 * 360}, 100%, 75%)` : this.colors[0];
        
        for (let p of this.particles) {
            // To make it look smooth even at high speeds, draw a line between the previous and new positions instead of a point
            Utils.drawLine(this.ctx, p.prevX, p.prevY, p.x, p.y, 1, color);
        }

        if(this.drawAttractors)
            for (let a of this.attractors)
                Utils.fillCircle(this.ctx, a.x, a.y, 5, this.colorsAlt[2])

        this.ctx.resetTransform();
    }

    resize() {
        this.clear();
    }

    restart() {
        super.restart();
        this.attractorsPosition = 0;
        this.setup();
    }

    mouseAction(cords, event) {
        if(event === "down") this.mouseDown = true;
        else if(event === "up") this.mouseDown = false;
        else if(event === "down" || (event === "move" && this.mouseDown)){
            console.log("attractor!");
            this.mouseAttractor = {
                x: (cords.x - this.ctx.canvas.width / 2) / this.scale,
                y: (cords.y - this.ctx.canvas.height / 2) / this.scale
            };
        }
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.resize();
    }

    getSettings() {
        return [{prop: "numParticles", type: "int", min: 1000, max: 20000, toCall: "setup"},
                {prop: "particlesSpeed", type: "float", min: 0.1, max: 1.5},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.1},
                {prop: "attractorsSystem", type: "select", values: this.attractorsSystems},
                {prop: "numAttractors", type: "int", min: 3, max: 7},
                {prop: "centralAttractor", type: "bool"},
                {prop: "attractorsSpeed", type: "float", min: -0.25, max: 0.25},
                {prop: "directionScale", type: "float", min: 0.0, max: 4.0},
                {prop: "addAnAttractor", type: "text", value: "<hold mouse button/touch>"},
                {prop: "drawAttractors", type: "bool"},
                {prop: "scale", type: "float", min: 0.05, max: 1.95},
                {prop: "rainbowColors", type: "bool"}];
    }
}

module.exports = ParticlesAndAttractors;
