'use strict';

const Animation = require("./animation");
const PerlinNoise = require("./perlin-noise");
const Utils = require("./utils");

class PerlinNoiseParticles extends Animation {
    constructor(canvas, colors, particlePer100PixSq = 4, noiseScale = 1200) {
        super(canvas, colors);
        this.particlePer100PixSq = particlePer100PixSq;
        this.noiseScale = noiseScale;
        this.noise = new PerlinNoise();
        this.width = 0;
        this.height = 0;
        this.particles = [];
        this.imageData = null;
        this.resize();
    }

    getFPS(){
        return 25;
    }

    getName(){
        return "particles moving through Perlin noise"
    }

    update(elapsed) {
        for(let p of this.particles){
            let angle = this.noise.get(p.x / this.noiseScale, p.y / this.noiseScale) * 2 * Math.PI * this.noiseScale;
            p.x += Math.cos(angle) * p.speed;
            p.y += Math.sin(angle) * p.speed;
        }
    }

    draw() {
        for(let p of this.particles) Utils.fillCircle(this.ctx, p.color, p.x, p.y, p.radius);
        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    spawnParticles(x, y, width, height) {
        let newParticles = width / 100 * height / 100 * this.particlePer100PixSq;

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            this.particles.push({
                x: Math.random() * width + x,
                y: Math.random() * height + y,
                speed: Math.random() * 0.15 + 0.10,
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
        // const gridWidth = this.ctx.canvas.width / this.moveScale;
        // const gridHeight = this.ctx.canvas.height / this.moveScale;
        // const pixelSize = 20;
        // const numPixels = gridWidth / this.ctx.canvas.width * pixelSize;
        // for (let y = 0; y < gridHeight; y += numPixels){
        //     for (let x = 0; x < gridWidth; x += numPixels){
        //         let v = parseInt(this.noise.get(x, y) * 250);
        //         this.ctx.fillStyle = 'hsl(' + v + ',50%,50%)';
        //         this.ctx.fillRect(x / gridWidth * this.ctx.canvas.width, y / gridHeight * this.ctx.canvas.height, pixelSize, pixelSize);
        //     }
        // }
    }
}

module.exports = PerlinNoiseParticles;
