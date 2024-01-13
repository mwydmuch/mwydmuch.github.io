'use strict';

const NAME = "ML in PL Network",
      FILE = "mlinpl.js",
      DESC = `
Simple network animation, I created for ML in PL websites.

For the first time used on
[ML in PL Conference 2023 website](https://conference2023.mlinpl.org/).
and [MLSS^S 2023 website](https://mlss2023.mlinpl.org/).

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class MLinPL extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                particlesDensity = 1,
                connectionThreshold = 125,
                originalColors = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.particlesDensity = particlesDensity;
        this.connectionThreshold = connectionThreshold;
        this.originalColors = originalColors;

        this.width = 0;
        this.height = 0;
        this.logoScale = 0.5;
        
        this.logoBlack = new Image();
        this.logoBlack.src = "assets/logo-mlinpl-black.png";
        this.particlesColorsBlack = [this.colors[0], "#000", "#222", "#444", "#AAA", "#EEE"];

        this.logoWhite = new Image();
        this.logoWhite.src = "assets/logo-mlinpl-white.png";

        this.particlesColorsWhite = [this.colors[0], "#FFF", "#DDD", "#BBB", "#555", "#111"];

        this.particlesColors = null;
        this.bgParticles = []; // Background particles
        this.mgParticles = []; // Middle ground particles
        this.fgParticles = []; // Foreground particles
        this.bgParticlesCfg = {
            colors: {5: 1.0},
            lineColors: {5: 1.0},
            sizeMin: 4,
            sizeRange: 3,
            speedMax: 0.5,
            groups: [[0, 1], [0, 2], [1, 2]],
            density: 0.00015
        };
        this.mgParticlesCfg = {
            colors: {4: 1.0},
            lineColors: {4: 1.0},
            sizeMin: 2,
            sizeRange: 2,
            speedMax: 0.75,
            groups: [[]], // This group of particles has no connecting lines
            density: 0.00015
        };
        this.fgParticlesCfg = {
            colors: {0: 0.4, 1: 0.6},
            lineColors: {1: 0.3, 2: 0.3, 3: 0.3},
            sizeMin: 2,
            sizeRange: 5,
            speedMax: 1,
            groups: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4], [0], [1], [2], [3], [4], [0], [1], [2], [3], [4]],
            density: 0.0003
        };
    }

    updateParticles(particles, elapsed){
        for (let p of particles) {
            let prevSinVal = Math.sin(p.x / p.freq) * p.amp;
            p.x += p.velX * elapsed / 33;
            let nextSinVal = Math.sin(p.x / p.freq) * p.amp;
            p.y += p.velY * (prevSinVal - nextSinVal) * elapsed / 33;
        
            // Wrap around the left and right
            if(p.x < -this.connectionThreshold) p.x = this.width + this.connectionThreshold; 
            else if(p.x > this.width + this.connectionThreshold) p.x = -this.connectionThreshold;
            if(p.y + p.size >= this.height) p.velY *= -1;
        }
    }

    createParticles(x, y, width, height, particlesCfg) {
        let newParticlesCount = width * height * particlesCfg.density * this.particlesDensity,
            newParticles = [];
    
        // Create new particles
        for(let i = 0; i < newParticlesCount; i++){
            newParticles.push({
                x: this.rand() * (width + 2 * this.connectionThreshold) + x - this.connectionThreshold,
                y: Utils.randomNormal(0, 1, this.rand) * 1 / 2 * height + y,
                velX: (this.rand() * 2 - 1) * particlesCfg.speedMax,
                velY: (this.rand() * 2 - 1) * particlesCfg.speedMax,
                freq: this.rand() * 100 + 100,
                amp: this.rand() * 200,
                size: this.rand() * particlesCfg.sizeRange + particlesCfg.sizeMin,
                color: Utils.randomRulletChoice(particlesCfg.colors, this.rand),
                lineColor: Utils.randomRulletChoice(particlesCfg.lineColors, this.rand),
                groups: Utils.randomChoice(particlesCfg.groups, this.rand),
            });
        }
    
        return newParticles;
    }

    spawnParticles(x, y, width, height) {
        this.bgParticles.push(...this.createParticles(x, y, width, height, this.bgParticlesCfg));
        this.mgParticles.push(...this.createParticles(x, y, width, height, this.mgParticlesCfg));
        this.fgParticles.push(...this.createParticles(x, y, width, height, this.fgParticlesCfg));
    }

    update(elapsed){
        super.update(elapsed);

        // Update all the groups of particles
        this.updateParticles(this.bgParticles, elapsed);
        this.updateParticles(this.mgParticles, elapsed);
        this.updateParticles(this.fgParticles, elapsed);
    }

    drawParticles(particles){
        // Draw lines between particles in the same group
        for (let i = 0; i < particles.length - 1; i++){
            // Skip particles that are not in any group - can't connect to any other particle
            if (particles[i].groups.length === 0) continue;
    
            for(let j = i + 1;  j < particles.length; j++){
                const p1 = particles[i],
                      p2 = particles[j];
    
                // This part can be done faster by creating indexes for groups, but I'm too lazy to implemt it
                if(Utils.distVec2d(p1, p2) > this.connectionThreshold) continue;
    
                for (let g of p1.groups){  
                    if (p2.groups.includes(g)){
                        Utils.drawLine(this.ctx, p1.x, p1.y, p2.x, p2.y, 1, this.particlesColors[p1.lineColor]);
                        break;
                    }
                }
            }
        }
    
        // Draw all particles
        for (let p of particles) Utils.fillCircle(this.ctx, p.x, p.y, p.size, this.particlesColors[p.color]);
    }

    draw() {
        if(this.bgColor === "#000000"){
            this.particlesColors = this.particlesColorsWhite;
            this.logo = this.logoWhite;
        } else {
            this.particlesColors = this.particlesColorsBlack;
            this.logo = this.logoBlack;
        }

        if(this.originalColors) this.particlesColors[0] = "#E7322A";
        else this.particlesColors[0] = this.colors[0];

        this.clear();

        // Draw all the groups of particles
        this.drawParticles(this.bgParticles);
        this.drawParticles(this.mgParticles);
        this.drawParticles(this.fgParticles);
        
        if(this.originalColors) {
            const logoWidth = this.logo.width * this.logoScale,
                  logoHeight = this.logo.height * this.logoScale;
            this.ctx.drawImage(this.logo, (this.width - logoWidth) / 2, (this.height - logoHeight) / 2, logoWidth, logoHeight);
        }
    }

    resize() {
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
    
        // Reset and generate new particles 
        // (this is easier than trying to resize the existing ones)
        this.bgParticles = [];
        this.mgParticles = [];
        this.fgParticles = [];
        this.spawnParticles(0, 0, this.width, this.height);
    }

    getSettings() {
        return [{prop: "particlesDensity", type: "float", min: 0, max: 2, step: 0.1, toCall: "resize"},
                {prop: "connectionThreshold", type: "float", min: 0, max: 250, step: 1},
                {prop: "originalColors", type: "bool"},
                this.getSeedSettings()];
    }
}

module.exports = MLinPL;
