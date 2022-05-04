/*
 * "Particles waves" animation.
 * The effect was achieved by modifying perlin-noise-particles.js.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Noise = require("./noise");
const Utils = require("./utils");

class ParticlesStorm extends Animation {
    constructor(canvas, colors, colorsAlt, 
                particlePer100PixSq = 48, 
                noiseScale = 0.001,
                fadingSpeed = 0.02) {
        super(canvas, colors, colorsAlt, "particles waves", "particles-waves.js");

        this.particlePer100PixSq = particlePer100PixSq;
        this.noiseScale = noiseScale;
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));
        this.fadingSpeed = fadingSpeed;
        this.particles = [];
        
        this.width = 0;
        this.height = 0;
    }

    update(elapsed) {
        this.time += elapsed / 1000;
        ++this.frame;

        for(let p of this.particles){
            const theta = this.noise.perlin3(p.x * this.noiseScale * 2,
                p.y  *this.noiseScale * 3,
                this.frame * this.noiseScale * 3) * 2 * Math.PI;
            p.x += 2 * Math.tan(theta);
            p.y += 2 * Math.sin(theta);

            // Wrap particles
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width ) p.x = 0;
            if (p.y < 0 ) p.y = this.height;
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
        Utils.clear(this.ctx, this.bgColor);
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        const newParticles = this.width / 100 * this.height / 100 * this.particlePer100PixSq;

        // Create new particles
        this.particles = [];
        for(let i = 0; i < newParticles; i++){
            const particleX = Math.random() * this.width,
                  particleY = Math.random() * this.height;
            this.particles.push({
                x: particleX,
                y: particleY,
                color: Utils.lerpColor(this.colorA, this.colorB, particleX / this.width)
            });
        }
    }

    getSettings() {
        return [{
            prop: "particlePer100PixSq",
            type: "int",
            min: 1,
            max: 128,
            toCall: "resize",
        }, {
            prop: "noiseScale",
            type: "float",
            step: 0.0001,
            min: 0,
            max: 0.01,
        }, {
            prop: "fadingSpeed",
            type: "float",
            step: 0.001,
            min: 0,
            max: 0.1,
        }];
    }
}

module.exports = ParticlesStorm;
