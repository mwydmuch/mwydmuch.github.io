'use strict';

// Based on: https://github.com/joeiddon/perlin
class PerlinNoise {
    constructor() {
        // It uses "memory" of gradients and values already calculated for Perlin noise
        this.noiseGradients = {};
        this.noiseMemory = {};
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

    get(x, y) {
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
}

module.exports = PerlinNoise;
