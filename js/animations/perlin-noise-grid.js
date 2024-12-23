'use strict';

// TODO: Improve this description
const NAME = "visualization of Perlin noise",
      FILE = "perlin-noise-grid.js",
      TAGS = ["framerate-independent", "2d", "perlin noise", "grid"],
      DESC = `
Grid of particles visualizing Perlin noise.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("../animation");
const Utils = require("../utils");

class PerlinNoiseGrid extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                cellSize = 12,
                cellStyle = "square",
                noiseScale = 0.002,
                noiseSpeed = {x: "random", y: "random", z: 1}
            ) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.pointsDensity = pointsDensity;
        this.drawPoints = drawPoints;
        this.maxPointsInNode = maxPointsInNode;
        this.noiseThreshold = noiseThreshold;
        this.drawLeafNodes = drawLeafNode;

        this.noiseScale = noiseScale;
        this.noiseSpeed = noiseSpeed;
        this.noisePos = {x: 0, y: 0, z: 0};
        this.noiseSpeed.x = this.assignIfRandom(this.noiseSpeed.x, Utils.round(Utils.randomRange(-1, 1), 1));
        this.noiseSpeed.y = this.assignIfRandom(this.noiseSpeed.y, Utils.round(Utils.randomRange(-1, 1), 1));

        this.minNodeSize = 4;

        this.width = 0;
        this.height = 0;
        this.noisePos = {x: 0, y: 0, z: 0};
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
        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }



    restart(){
        super.restart();
        this.clear();
        this.particles = []
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.spawnParticles(0, 0, this.width, this.height);
    }

    resize() {
        this.clear();
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

        // Add particles to the new parts of the canvas.
        const divWidth = this.canvas.width - this.width,
              divHeight = this.canvas.height - this.height;

        if(divWidth > 0) this.spawnParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spawnParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spawnParticles(this.width, this.height, divWidth, divHeight);

        this.width = this.canvas.width;
        this.height = this.canvas.height;

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
                {prop: "cellSize", type: "float", step: 0.1, min: 1, max: 4},
                {prop: "fadingSpeed", type: "float", step: 0.0001, min: 0, max: 0.01},
                this.getSeedSettings()];
    }
}

module.exports = PerlinNoiseGrid;
