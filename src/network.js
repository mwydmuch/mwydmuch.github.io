/*
 * Work in progress.
 *
 * Makes use of a delaunay algorithm to create network-like structure.
 *
 * Coded with no external dependencies, using only canvas API.
 */


const Animation = require("./animation");
const Utils = require("./utils");
const Delaunay = require("./delaunay");

class Network extends Animation {
    constructor(canvas, colors, colorsAlt,
                particlesDensity = 0.0005,
                fillTriangles = true,
                drawParticles = true,
                distanceThreshold = 75) {
        super(canvas, colors, colorsAlt, "Network", "network.js");

        this.particlesDensity = particlesDensity;
        this.fillTriangles = fillTriangles;
        this.drawParticles = drawParticles;
        this.distanceThreshold = distanceThreshold;

        this.particles = [];
    }

    drawTriangle(p1, p2, p3){
        // Don't draw triangle if its area is too big.
        const maxDist = Math.max(Utils.distVec2d(p1, p2), Utils.distVec2d(p1, p2), Utils.distVec2d(p2, p3));
        if (maxDist > this.distanceThreshold) return;

        this.ctx.beginPath();
        Utils.pathClosedShape(this.ctx, [p1, p2, p3]);
        const color = Utils.lerpColor(p1.color, this.bgColor, Utils.easeInSine(maxDist / this.distanceThreshold));
        if(this.fillTriangles){
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }

    update(elapsed){
        for(let p of this.particles){
            p.x += p.velX * elapsed / 1000 * this.speed;
            p.y += p.velY * elapsed / 1000 * this.speed;

            if(p.x < 0 || p.x > this.width) p.velX *= -1;
            if(p.y < 0 || p.y > this.height) p.velY *= -1;
        }
    }

    draw() {
        this.fadeOut(this.fadingSpeed);
        if (this.particles.length > 0) {
            // Run script to get points to create triangles with.
            let data = Delaunay.triangulate(this.particles.map(function(p) {
                return [p.x, p.y];
            }));

            // Display triangles individually.
            for (let i = 0; i < data.length; i += 3) {
                // Collect particles that make this triangle.
                const p1 = this.particles[data[i]],
                      p2 = this.particles[data[i + 1]],
                      p3 = this.particles[data[i + 2]];

                this.drawTriangle(p1, p2, p3);
            }
        }
        if(this.drawParticles) {
            for (let p of this.particles) {
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(p.x, p.y, 1, 1);
            }
        }
    }

    resize() {
        this.clear();
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        const newParticles = this.width * this.height * this.particlesDensity;

        // Create new particles
        this.particles = [];
        for(let i = 0; i < newParticles; i++){
            const particleX = Math.random() * this.width,
                  particleY = Math.random() * this.height;
            this.particles.push({
                x: particleX,
                y: particleY,
                velY: Math.random() * 60 - 30,
                velX: Math.random() * 60 - 30,
                color: Utils.randomChoice(this.colors)
            });
        }
    }

    getSettings() {
        return [{prop: "particlesDensity", type: "float", step: 0.0001, min: 0.0001, max: 0.002, toCall: "resize"},
                {prop: "fillTriangles", type: "bool"},
                {prop: "drawParticles", type: "bool"},
                {prop: "distanceThreshold", type: "int", min: 0, max: 200},
                {prop: "speed", type: "float", step: 0.1, min: -4, max: 4}];
    }
}

module.exports = Network;
