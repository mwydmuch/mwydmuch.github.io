'use strict';

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class ParticlesVortex extends Animation {
    constructor (canvas, colors, colorsAlt,
                 particles = 1500,
                 radiusMin = 100,
                 radiusMax = 200,
                 speedMin = 25,
                 speedMax = 50,
                 rotationSpeedMin = 0.01,
                 rotationSpeedMax = 0.03
    ){
        super(canvas, colors, colorsAlt);

        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));

        this.particles = particles;
        this.radius = Utils.randomRange(radiusMin, radiusMax);
        this.speed = Utils.randomRange(speedMin, speedMax) * Utils.randomChoice([-1, 1]);
        this.rotationSpeed = Utils.randomRange(rotationSpeedMin, rotationSpeedMax) * Utils.randomChoice([-1, 1]);
        this.dirX = Utils.randomRange(-0.75, 0.75);
        this.dirY = Utils.randomRange(-0.75, 0.75);

        this.time = 0;
        this.frame = 0;
        this.resize();
    }

    getName(){
        return "vortex of particles";
    }

    update(elapsed){
        this.time += elapsed / 1000;
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];

        const offset = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 4,
              centerX = this.ctx.canvas.width / 2 + this.dirX * offset,
              centerY = this.ctx.canvas.height / 2 + this.dirY * offset,
              s = Math.round(this.time * this.speed) / 2;

        this.ctx.beginPath();
        for(let i = 1; i <= this.particles; i++){
            const r = this.radius + Math.pow(i / (this.particles / 1.5),2) * i / 2,
                  p = this.noise.perlin2(i * 0.1 + s, 0.1) * 100 + s * this.rotationSpeed,
                  x = centerX + Math.cos(p) * r + Math.sqrt(i * this.radius) * this.dirX,
                  y = centerY + Math.sin(p) * r + Math.sqrt(i * this.radius) * this.dirY;

            Utils.pathCircle(this.ctx, x, y, i * 0.01);
        }
        this.ctx.stroke();
    }
}

module.exports = ParticlesVortex;
