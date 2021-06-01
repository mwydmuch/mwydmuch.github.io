'use strict';

class PerlinNoise {
    constructor(canvas, colors, particlePer100PixSq = 4, noiseScale = 1200) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.width = 0;
        this.height = 0;
        this.particlePer100PixSq = particlePer100PixSq;
        this.colors = colors;
        this.particles = [];
        this.imageData = null;

        // To make it more efficient use "memory" of gradients and values already calculated for Perlin Noise
        this.noiseScale = noiseScale;
        this.noiseGradients = {};
        this.noiseMemory = {};
        this.resize();
    }

    getName(){
        return "particles moving through Perlin noise"
    }

    dotNoiseGrid(x, y, vx, vy){
        let dVec = {x: x - vx, y: y - vy};
        let gVec;
        if (this.noiseGradients[[vx, vy]]){
            gVec = this.noiseGradients[[vx, vy]];
        } else {
            let theta = Math.random() * 2 * Math.PI;
            gVec = {x: Math.cos(theta), y: Math.sin(theta)};
            this.noiseGradients[[vx, vy]] = gVec;
        }
        return dVec.x * gVec.x + dVec.y * gVec.y;
    }

    interpolate(x, a, b){
        //return a + x * (b - a);
        return a + (6 * x**5 - 15 * x**4 + 10 * x**3) * (b - a);
    }

    getNoise(x, y) {
        // Get from memory if already calculated
        if (this.noiseMemory.hasOwnProperty([x, y]))
            return this.noiseMemory[[x, y]];

        let xf = Math.floor(x);
        let yf = Math.floor(y);

        // Interpolate
        let tl = this.dotNoiseGrid(x, y, xf, yf);
        let tr = this.dotNoiseGrid(x, y, xf + 1, yf);
        let bl = this.dotNoiseGrid(x, y, xf, yf + 1);
        let br = this.dotNoiseGrid(x, y, xf + 1, yf + 1);
        let xt = this.interpolate(x - xf, tl, tr);
        let xb = this.interpolate(x - xf, bl, br);
        let v = this.interpolate(y - yf, xt, xb);

        this.noiseMemory[[x, y]] = v;
        return v;
    }

    update(elapsed) {
        for(let i = 0; i < this.particles.length; i++){
            let angle = this.getNoise(this.particles[i].x / this.noiseScale, this.particles[i].y / this.noiseScale) * 2 * Math.PI * this.noiseScale;
            this.particles[i].x += Math.cos(angle) * this.particles[i].speed;
            this.particles[i].y += Math.sin(angle) * this.particles[i].speed;
        }
    }

    draw() {
        for(let i = 0; i < this.particles.length; i++) {
            this.ctx.fillStyle = this.particles[i].color;
            this.ctx.beginPath();
            this.ctx.arc(this.particles[i].x, this.particles[i].y, this.particles[i].radius, 0, 2 * Math.PI, false);
            this.ctx.fill();
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    spanParticles(x, y, width, height) {
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
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        if(this.imageData != null) this.ctx.putImageData(this.imageData, 0, 0);

        // Add particles to new parts of the image
        let divWidth = this.ctx.canvas.width - this.width;
        let divHeight = this.ctx.canvas.height - this.height;

        if(divWidth > 0) this.spanParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spanParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spanParticles(this.width, this.height, divWidth, divHeight);

        this.width = Math.max(this.ctx.canvas.width, this.width);
        this.height = Math.max(this.ctx.canvas.height, this.height);

        // Visualize Perlin noise
        // const gridWidth = this.ctx.canvas.width / this.moveScale;
        // const gridHeight = this.ctx.canvas.height / this.moveScale;
        // const pixelSize = 20;
        // const numPixels = gridWidth / this.ctx.canvas.width * pixelSize;
        // for (let y = 0; y < gridHeight; y += numPixels){
        //     for (let x = 0; x < gridWidth; x += numPixels){
        //         let v = parseInt(this.getNoise(x, y) * 250);
        //         this.ctx.fillStyle = 'hsl(' + v + ',50%,50%)';
        //         this.ctx.fillRect(x / gridWidth * this.ctx.canvas.width, y / gridHeight * this.ctx.canvas.height, pixelSize, pixelSize);
        //     }
        // }
    }
}

module.exports = PerlinNoise
