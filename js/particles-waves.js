'use strict';

const NAME = "particles waves",
      FILE = "particles-waves.js",
      DESC = `
"Particles waves" animation.
The effect was achieved by modifying Perlin noise animation.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class ParticlesStorm extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlesDensity = 0.01,
                noiseScale = 0.001,
                fadingSpeed = 0.02) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.particlesDensity = particlesDensity;
        this.noiseScale = noiseScale;
        this.fadingSpeed = fadingSpeed;

        this.particles = [];
        this.width = 0;
        this.height = 0;
    }

    update(elapsed) {
        super.update(elapsed);

        for(let p of this.particles){
            const theta = this.noise.perlin3(p.x * this.noiseScale * 2,
                                             p.y * this.noiseScale * 3,
                                             this.frame * this.noiseScale * 3) * 2 * Math.PI;
            p.x += 2 * Math.tan(theta);
            p.y += 2 * Math.sin(theta);

            // Wrap particles
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width ) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y =  0;
        }
    }

    draw() {
        this.fadeOut(this.fadingSpeed);
        for(let p of this.particles){
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 1, 1);
        }
    }

    resize() {
        this.clear();
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        const newParticles = this.width * this.height * this.particlesDensity;

        // Create new particles
        this.particles = [];
        for(let i = 0; i < newParticles; i++){
            const particleX = this.rand() * this.width,
                  particleY = this.rand() * this.height;
            this.particles.push({
                x: particleX,
                y: particleY,
                color: Utils.lerpColor(this.colorA, this.colorB, particleX / this.width)
            });
        }
    }

    getSettings() {
        return [{prop: "particlesDensity", type: "float", step: 0.0001, min: 0.0001, max: 0.05, toCall: "resize"},
                {prop: "noiseScale", type: "float", step: 0.001, min: 0.001, max: 0.01},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.1},
                this.getSeedSettings()];
    }
}

module.exports = ParticlesStorm;
