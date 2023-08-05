'use strict';

const NAME = "ML in PL Network",
      FILE = "mlinpl.js",
      DESC = `
Simple network animation, I've created for ML in PL websites.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class MLinPL extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlesDensity = 1,
                connectionDistanceThreshold = 125) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.particlesDensity = particlesDensity;
        this.connectionDistanceThreshold = connectionDistanceThreshold;

        this.width = 0;
        this.height = 0;

        this.bgParticles = []; // Background particles
        this.mgParticles = []; // Middle ground particles
        this.fgParticles = []; // Foreground particles
        this.bgParticlesCfg = {
            colors: "#EEE",
            lineColors: "#EEE",
            sizeMin: 4,
            sizeRange: 3,
            speedMax: 0.5,
            groups: [[0, 1], [0, 2], [1, 2]],
            density: 0.00015
        };
        this.mgParticlesCfg = {
            colors: "#AAA",
            lineColors: "#AAA",
            sizeMin: 2,
            sizeRange: 2,
            speedMax: 0.75,
            groups: [[]], // This group of particles has no connecting lines
            density: 0.00015
        };
        let fgColors = {}
        fgColors[this.colors[0]] = 0.4;
        fgColors["#000"] = 0.6;
        this.fgParticlesCfg = {
            colors: fgColors,
            lineColors: {"#000": 0.3, "#222": 0.3, "#444": 0.3},
            sizeMin: 2,
            sizeRange: 5,
            speedMax: 1,
            groups: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4], [0], [1], [2], [3], [4], [0], [1], [2], [3], [4]],
            density: 0.0003
        };
    }

    updateParticles(particles, elapsed){
        for (let p of particles) {
            let prevSinVal = Math.sin(p.x / p.freq) * p.amp * elapsed / 33;
            p.x += p.velX;
            let nextSinVal = Math.sin(p.x / p.freq) * p.amp * elapsed / 33;
            p.y += p.velY * (prevSinVal - nextSinVal);
        
            // Wrap around the left and right
            if(p.x < -this.connectionDistanceThreshold) p.x = this.width + this.connectionDistanceThreshold; 
            else if(p.x > this.width + this.connectionDistanceThreshold) p.x = -this.connectionDistanceThreshold;
            if(p.y + p.size >= this.height) p.velY *= -1;
        }
    }

    createParticles(x, y, width, height, particlesCfg) {
        let newParticlesCount = width * height * particlesCfg.density * this.particlesDensity,
            newParticles = [];
    
        // Create new particles
        for(let i = 0; i < newParticlesCount; i++){
            newParticles.push({
                x: this.rand() * (width + 2 * this.connectionDistanceThreshold) + x - this.connectionDistanceThreshold,
                y: Utils.randomNormal(0, 1, this.rand) * 1 / 2 * height + y,
                velX: (this.rand() * 2 - 1) * particlesCfg.speedMax,
                velY: (this.rand() * 2 - 1) * particlesCfg.speedMax,
                freq: this.rand() * 100 + 100,
                amp: this.rand() * 100,
                size: this.rand() * particlesCfg.sizeRange + particlesCfg.sizeMin,
                color: typeof particlesCfg.colors === "string" ? particlesCfg.colors : Utils.randomRulletChoice(particlesCfg.colors, this.rand),
                lineColor: typeof particlesCfg.lineColors === "string" ? particlesCfg.lineColors : Utils.randomRulletChoice(particlesCfg.lineColors, this.rand),
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
                if(Utils.distVec2d(p1, p2) > this.connectionDistanceThreshold) continue;
    
                for (let g of p1.groups){  
                    if (p2.groups.includes(g)){
                        Utils.drawLine(this.ctx, p1.x, p1.y, p2.x, p2.y, 1, p1.lineColor);
                        break;
                    }
                }
            }
        }
    
        // Draw all particles
        for (let p of particles) Utils.fillCircle(this.ctx, p.x, p.y, p.size, p.color);
    }

    draw() {
        // Draw all the groups of particles
        this.clear();
        this.drawParticles(this.bgParticles);
        this.drawParticles(this.mgParticles);
        this.drawParticles(this.fgParticles);
    }

    restart(){
        this.resize();
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
                {prop: "connectionDistanceThreshold", type: "float", min: 0, max: 250, step: 1},
                this.getSeedSettings()];
    }
}

module.exports = MLinPL;
