/*
 * Particles moving through Perlin noise.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class PerlinNoiseParticles extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlePer100PixSq = 4,
                noiseScale = 0.001,
                drawNoise = false
    ) {
        super(canvas, colors, colorsAlt, "particles moving through Perlin noise", "perlin-noise-particles.js");
        this.particlePer100PixSq = particlePer100PixSq;
        this.noiseScale = noiseScale;
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));
        this.drawNoise = drawNoise;

        this.width = 0;
        this.height = 0;
        this.particles = [];
        this.imageData = null;
    }

    update(timeElapsed) {
        // TODO: Make it time dependent
        for(let p of this.particles){
            const angle = this.noise.perlin2(p.x * this.noiseScale, p.y * this.noiseScale) * 2 * Math.PI / this.noiseScale;
            p.prevX = p.x;
            p.prevY = p.y;
            p.x += Math.cos(angle) * p.speed;
            p.y += Math.sin(angle) * p.speed;
        }
    }

    draw() {
        for(let p of this.particles){
            // Utils.fillCircle(this.ctx, p.color, p.x, p.y, p.radius);
            Utils.drawLine(this.ctx, p.prevX, p.prevY, p.x, p.y, p.color, 2 * p.radius); // This results with better antialiasing
        }
        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    spawnParticles(x, y, width, height) {
        let newParticles = width / 100 * height / 100 * this.particlePer100PixSq;

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            const particleX = Math.random() * width + x,
                  particleY = Math.random() * height + y;
            this.particles.push({
                x: particleX,
                y: particleY,
                prevX: particleX,
                prevY: particleY,
                speed: Math.random() * 0.20 + 0.10,
                radius: Math.random() * 0.5 + 0.5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)]
            });
        }
    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");
        if(this.imageData != null) this.ctx.putImageData(this.imageData, 0, 0);

        // Add particles to new parts of the image
        let divWidth = this.ctx.canvas.width - this.width;
        let divHeight = this.ctx.canvas.height - this.height;

        if(divWidth > 0) this.spawnParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spawnParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spawnParticles(this.width, this.height, divWidth, divHeight);

        this.width = Math.max(this.ctx.canvas.width, this.width);
        this.height = Math.max(this.ctx.canvas.height, this.height);

        // Visualize Perlin noise
        if(this.drawNoise) {
            const gridWidth = this.ctx.canvas.width * this.noiseScale,
                  gridHeight = this.ctx.canvas.height * this.noiseScale,
                  pixelSize = 10,
                  numPixels = gridWidth / this.ctx.canvas.width * pixelSize;

            for (let y = 0; y < gridHeight; y += numPixels) {
                for (let x = 0; x < gridWidth; x += numPixels) {
                    let v = Math.floor(this.noise.perlin2(x, y) * 250);
                    this.ctx.fillStyle = 'hsl(' + v + ',50%,50%)';
                    this.ctx.fillRect(x / gridWidth * this.ctx.canvas.width, y / gridHeight * this.ctx.canvas.height, pixelSize, pixelSize);
                }
            }
        }
    }
}

module.exports = PerlinNoiseParticles;
