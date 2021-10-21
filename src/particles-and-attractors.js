/*
 * Very simple particles system with attractors.
 * In this system distance and momentum are ignored.
 * New velocity vector of a particle is calculated as sum of angles
 * between particle and all attractors (see line 51+).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class ParticlesAndAttractors extends Animation {
    constructor (canvas, colors, colorsAlt,
                 numParticles= 10000,
                 numAttractors = 5,
                 drawAttractors = false
    ) {
        super(canvas, colors, colorsAlt, "system of particles and attractors", "particles-and-attractors.js");
        this.particles = []
        this.particlesSpeed = Utils.randomRange(5, 15);

        this.drawAttractors = drawAttractors;
        this.numAttractors = numAttractors;
        this.attractorsSystem = Utils.randomChoice(["circles", "eights"]);
        this.attractorsSpeed = Utils.randomRange(0.05, 0.1) * Utils.randomChoice([-1, 1]);
        this.timeBase = Utils.randomRange(0, 10);

        for (let i = 0; i < numParticles; ++i)
            this.particles.push(Utils.rotateVec(Utils.createVec(Utils.randomRange(1, 100), 0), i));
    }

    draw() {
        Utils.blendColor(this.ctx, "#FFFFFF", 0.03, "lighter");

        const centerX = this.ctx.canvas.width / 2,
              centerY = this.ctx.canvas.height / 2,
              t = (this.timeBase + this.time) * this.attractorsSpeed;

        let attractors = [];
        if(this.attractorsSystem == "circles") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / (2 * (this.numAttractors - 1));
            for (let i = 0; i < this.numAttractors; ++i)
                attractors.push(Utils.rotateVec(Utils.createVec(i * s, 0), t * i));
        } else if (this.attractorsSystem == "eights") {
            const s = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / this.numAttractors;
            for (let i = 0; i < this.numAttractors; ++i)
                attractors.push(Utils.rotateVec(Utils.createVec(i * t * s, 0), t * i));
        }

        for (let p of this.particles) {
            let d = 0
            for (let a of attractors) d += Math.atan2(a.y - p.y, a.x - p.x);

            const prevX = p.x, prevY = p.y;
            p.x += Math.cos(d) * this.particlesSpeed;
            p.y += Math.sin(d) * this.particlesSpeed;

            Utils.drawLine(this.ctx, centerX + prevX, centerY + prevY, centerX + p.x, centerY + p.y, this.colors[0]);
        }

        if(this.drawAttractors)
            for (let a of attractors)
                Utils.fillCircle(this.ctx, this.colorsAlt[0], centerX + a.x, centerY + a.y, 5)
    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");
    }
}

module.exports = ParticlesAndAttractors;