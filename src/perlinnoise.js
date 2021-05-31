'use strict';

class PerlinNoise {
    constructor(canvas, colors, particlePer100PixSq = 5, noiseScale = 1200) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.width = 0;
        this.height = 0;
        this.noiseScale = noiseScale;
        this.particlePer100PixSq = particlePer100PixSq;
        this.colors = colors;
        this.particles = [];
        this.noiseGradients = {};
        this.noiseMemory = {};
        this.resize();
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
    }

    resize() {
        let newWidth = this.ctx.canvas.width;
        let newHeight = this.ctx.canvas.height;

        let newParticles = newWidth / 100 * newHeight / 100 * this.particlePer100PixSq;
        // if(newWidth - this.width > 0 || newHeight - this.height > 0) {
        //     let newParticles = (newWidth - this.width) * newHeight + ;
        // }

        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            this.particles.push({
                x: Math.random() * newWidth,
                y: Math.random() * newHeight,
                speed: Math.random() * 0.15 + 0.10,
                radius: Math.random() * 0.5 + 0.5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)]
            });
        }

        // Visualize perlin noise
        // const gridWidth = this.ctx.canvas.width / this.moveScale;
        // const gridHeight = this.ctx.canvas.height / this.moveScale;
        // const pixelSize = 20;
        // const numPixels = gridWidth / this.ctx.canvas.width * pixelSize;
        // console.log(this.ctx.canvas.width, this.ctx.canvas.height, gridWidth, gridHeight, pixelSize, numPixels)
        // for (let y = 0; y < gridHeight; y += numPixels){
        //     for (let x = 0; x < gridWidth; x += numPixels){
        //         let v = parseInt(this.getNoise(x, y) * 250);
        //         this.ctx.fillStyle = 'hsl('+v+',50%,50%)';
        //         this.ctx.fillRect(x / gridWidth * this.ctx.canvas.width, y / gridHeight * this.ctx.canvas.height, pixelSize, pixelSize);
        //     }
        // }
    }
}

module.exports = PerlinNoise
