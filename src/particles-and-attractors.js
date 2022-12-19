'use strict';

/*
 * Very simple particles system with attractors.
 * In this system, distance and momentum are ignored.
 * The new velocity vector of a particle is calculated as the sum of angles
 * between the particle and all attractors (see line 51+).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class ParticlesAndAttractors extends Animation {
    constructor (canvas, colors, colorsAlt,
                 numParticles= 10000,
                 particlesSpeed = "random",
                 fadingSpeed = 0.03,
                 numAttractors = 5,
                 attractorsSystem = "random",
                 attractorsSpeed = "random",
                 drawAttractors = false,
                 scale = 1,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, "system of particles and attractors", "particles-and-attractors.js");
        this.particles = []
        this.numParticles = numParticles;
        this.particlesSpeed = this.assignIfRandom(particlesSpeed, Utils.round(Utils.randomRange(5, 15)));
        this.fadingSpeed = fadingSpeed;

        this.drawAttractors = drawAttractors;
        this.numAttractors = numAttractors;

        this.attractorsSystems = ["orbits", "eights"]
        this.attractorsSystem = this.assignIfRandom(attractorsSystem, Utils.randomChoice(this.attractorsSystems));
        this.attractorsSpeed = this.assignIfRandom(attractorsSpeed, Utils.round(Utils.randomRange(0.05, 0.1) * Utils.randomChoice([-1, 1])));
        this.attractorsPosition = 0;
        this.startingPosition = Utils.randomRange(0, 10);

        this.scale = scale;
        this.rainbowColors = rainbowColors;

        this.setup();
    }

    setup(){
        this.particles = []
        for (let i = 0; i < this.numParticles; ++i)
            this.particles.push(Utils.rotateVec2d(Utils.createVec2d(Utils.randomRange(1, 100), 0), i));
    }

    update(elapsed){
        super.update(elapsed);
        this.attractorsPosition += elapsed / 1000 * this.attractorsSpeed;
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);

        const p = this.startingPosition + this.attractorsPosition;

        let attractors = [];
        if(this.attractorsSystem === "orbits") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / (2 * (this.numAttractors - 1));
            for (let i = 0; i < this.numAttractors; ++i)
                attractors.push(Utils.rotateVec2d(Utils.createVec2d(i * s, 0), p * i));
        } else if (this.attractorsSystem === "eights") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / this.numAttractors;
            for (let i = 0; i < this.numAttractors; ++i)
                attractors.push(Utils.rotateVec2d(Utils.createVec2d(i * Math.sin(p * Math.PI / 2) * s, 0), p * i));
        }

        const color = this.rainbowColors ? `hsl(${this.time / 5 * 360}, 100%, 75%)` : this.colors[0];

        for (let p of this.particles) {
            let d = 0
            for (let a of attractors) d += Math.atan2(a.y - p.y, a.x - p.x);

            const prevX = p.x, prevY = p.y;
            p.x += Math.cos(d) * this.particlesSpeed;
            p.y += Math.sin(d) * this.particlesSpeed;

            Utils.drawLine(this.ctx, prevX, prevY, p.x, p.y, color);
        }

        if(this.drawAttractors)
            for (let a of attractors)
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

    getSettings() {
        return [{prop: "numParticles", type: "int", min: 1000, max: 15000, toCall: "setup"},
                {prop: "particlesSpeed", type: "float", min: 1, max: 20},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.1},
                {prop: "attractorsSystem", type: "select", values: this.attractorsSystems},
                {prop: "numAttractors", type: "int", min: 3, max: 7},
                {prop: "attractorsSpeed", type: "float", min: -0.2, max: 0.2},
                {prop: "drawAttractors", type: "bool"},
                {prop: "scale", type: "float", min: 0.05, max: 1.95},
                {prop: "rainbowColors", type: "bool"}];
    }
}

module.exports = ParticlesAndAttractors;
