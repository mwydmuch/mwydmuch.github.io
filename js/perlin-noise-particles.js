'use strict';

// TODO: Improve this description
const NAME = "particles moving through Perlin noise",
      FILE = "perlin-noise-particles.js",
      DESC = `
Particles moving through Perlin noise.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class PerlinNoiseParticles extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                particlesDensity = 0.0007,
                noiseScale = "random",
                particlesSpeed = "random",
                particlesSize = "random",
                fadingSpeed = 0) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.particlesDensity = particlesDensity;
        this.noiseScale = this.assignIfRandom(noiseScale, Utils.randomChoice([0.001, 0.002, 0.003]));

        this.particlesSpeed = this.assignIfRandom(particlesSpeed, Utils.randomChoice([1, 1.5, 2]));
        this.particlesSize = this.assignIfRandom(particlesSize, Utils.randomChoice([1, 1.5, 2]));
        this.fadingSpeed = fadingSpeed;

        this.width = 0;
        this.height = 0;
        this.particles = [];
        this.imageData = null;
    }

    update(elapsed) {
        this.time += elapsed / 1000;
        ++this.frame;
        let updates = 1,
            particlesSpeed = this.particlesSpeed;

        while(particlesSpeed > 1.0){
            particlesSpeed /= 2;
            updates *= 2;
        }

        for (let p of this.particles) {
            p.prevX = p.x;
            p.prevY = p.y;
        }

        for(let i = 0; i < updates; ++i) {
            for (let p of this.particles) {
                const angle = this.noise.perlin2(p.x * this.noiseScale, p.y * this.noiseScale) * 2 * Math.PI / this.noiseScale;
                p.x += Math.cos(angle) * p.speed * particlesSpeed;
                p.y += Math.sin(angle) * p.speed * particlesSpeed;
            }
        }
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        for(let p of this.particles){
            // To make it look smooth even at high speeds, draw a line between the previous and new positions instead of a point
            // Drawing a line also results with a better antialiasing
            Utils.drawLine(this.ctx, p.prevX, p.prevY, p.x, p.y, 2 * p.radius * this.particlesSize, p.color); 
        }
        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    spawnParticles(x, y, width, height) {
        let newParticles = width * height * this.particlesDensity;

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            const particleX = this.rand() * width + x,
                  particleY = this.rand() * height + y;
            this.particles.push({
                x: particleX,
                y: particleY,
                prevX: particleX,
                prevY: particleY,
                speed: this.rand() * 0.20 + 0.10,
                radius: this.rand() * 0.5 + 0.5,
                color: Utils.randomChoice(this.colors, this.rand)
            });
        }
    }

    restart(){
        super.restart();
        this.clear();
        this.particles = []
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        this.spawnParticles(0, 0, this.width, this.height);
    }

    resize() {
        this.clear();
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

        // Add particles to the new parts of the canvas.
        const divWidth = this.ctx.canvas.width - this.width,
              divHeight = this.ctx.canvas.height - this.height;

        if(divWidth > 0) this.spawnParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spawnParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spawnParticles(this.width, this.height, divWidth, divHeight);

        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;

        // Remove particles that are out of bounds of the new canvas to improve performance.
        const width = this.width,
              height = this.height;
        this.particles = this.particles.filter(function(p){
            return !(p.x < 0 || p.x > width || p.y < 0 || p.y > height);
        });
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.restart();
    }

    getSettings() {
        return [{prop: "noiseScale", type: "float", step: 0.001, min: 0.001, max: 0.01, toCall: "restart"},
                {prop: "particlesDensity", type: "float", step: 0.0001, min: 0.0001, max: 0.005, toCall: "restart"},
                {prop: "particlesSpeed", type: "float", min: 0.25, max: 32},
                {prop: "particlesSize", type: "float", step: 0.1, min: 1, max: 4},
                {prop: "fadingSpeed", type: "float", step: 0.0001, min: 0, max: 0.01},
                this.getSeedSettings()];
    }
}

module.exports = PerlinNoiseParticles;
