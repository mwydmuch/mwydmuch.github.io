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
                particlesDensityModifier = 1,
                connectionDistanceThreshold = 125) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.particlesDensityModifier = particlesDensityModifier;
        this.connectionDistanceThreshold = connectionDistanceThreshold;

        this.width = 0;
        this.height = 0;

        this.mainColors = ["#000000"];  // 
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
        this.fgParticlesCfg = {
            colors: {1: 0.2, 0: 0.8},
            lineColors: {"#000": 0.3, "#222": 0.3, "#444": 0.3},
            sizeMin: 2,
            sizeRange: 5,
            speedMax: 1,
            groups: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4], [0], [1], [2], [3], [4], [0], [1], [2], [3], [4]],
            density: 0.0003
        };
    }

    updateParticle(p, elapsed){
        let prevSinVal = Math.sin(p.x / p.freq) * p.amp;
        p.x += p.velX;
        let nextSinVal = Math.sin(p.x / p.freq) * p.amp;
        p.y += p.velY * (prevSinVal - nextSinVal);
    
        // Wrap around the left and right
        if(p.x < -connectionDistanceThreshold) p.x = width + connectionDistanceThreshold; 
        else if(p.x > width + connectionDistanceThreshold) p.x = -connectionDistanceThreshold;
        if(p.y + p.size >= height) p.velY *= -1;
    }

    spawnParticles(x, y, width, height) {
        this.bgParticles.push(...this.createParticles(x, y, width, height, bgParticlesCfg));
        this.mgParticles.push(...this.createParticles(x, y, width, height, mgParticlesCfg));
        this.fgParticles.push(...this.createParticles(x, y, width, height, fgParticlesCfg));
    }

    update(elapsed){
        // Update position of particles
        for (let p of particles) updateParticle(p, elapsed);
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
                if(Utils.distVec2d(p1, p2) > connectionDistanceThreshold) continue;
    
                for (let g of p1.groups){  
                    if (p2.groups.includes(g)){
                        Utils.drawLine(this.ctx, p1.x, p1.y, p2.x, p2.y, 1);
                        break;
                    }
                }
            }
        }
    
        // Draw all particles
        for (let p of particles) drawParticle(p);
    }

    draw() {
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
        spawnParticles(0, 0, this.width, this.height);
    }

    getSettings() {
        return [this.getSeedSettings()];
    }
}

module.exports = MLinPL;
