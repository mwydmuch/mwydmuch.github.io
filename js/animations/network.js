'use strict';

const NAME = "Delaunay triangulation for a cloud of particles",
      FILE = "network.js",
      DESC = `
In this animation, the Delaunay triangulation algorithm 
is applied to a set of moving particles (points).
Then if the edge length between two points is below a threshold value,
a line is drawn between them, creating a network-like structure.

You can read about the Delaunay triangulation on [Wikipedia](https://en.wikipedia.org/wiki/Delaunay_triangulation)

Source of Delaunay triangulation implementation used in this animation
can be found in this [repository](https://github.com/darkskyapp/delaunay-fast).
`;

const Animation = require("../animation");
const Utils = require("../utils");
const Delaunay = require("../delaunay");

class Network extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                particlesDensity = 0.0002,
                fillTriangles = true,
                drawParticles = false,
                distanceThreshold = 125) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.particlesDensity = particlesDensity;
        this.fillTriangles = fillTriangles;
        this.drawParticles = drawParticles;
        this.distanceThreshold = distanceThreshold;

        this.width = 0;
        this.height = 0;
        this.particles = [];

        this.mouseDown = false;
        this.mouseParticle = {x: 0, y: 0, color: null};
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
        super.update(elapsed);
        for(let p of this.particles){
            p.x += p.velX * elapsed * this.speed;
            p.y += p.velY * elapsed * this.speed;

            if(p.x < 0 || p.x > this.width) p.velX *= -1;
            if(p.y < 0 || p.y > this.height) p.velY *= -1;
        }
    }

    draw() {
        this.clear();

        if(this.mouseDown) this.particles.push(this.mouseParticle);

        if (this.particles.length > 0) {
            // Run Delaunay traiangulation to get points to create triangles with.
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
            for (let p of this.particles) Utils.fillCircle(this.ctx, p.x, p.y, 2, p.color);
        }

        if(this.mouseDown) this.particles.pop();
    }

    spawnParticles(x, y, width, height) {
        let newParticles = width * height * this.particlesDensity;

        // Create new particles
        for(let i = 0; i < newParticles; i++){
            this.particles.push({
                x: this.rand() * width + x,
                y: this.rand() * height + y,
                velY: (this.rand() * 2 - 1) / 30,
                velX: (this.rand() * 2 - 1) / 30,
                color: Utils.randomChoice(this.colors, this.rand)
            });
        }
    }

    restart(){
        this.particles = []
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        this.spawnParticles(0, 0, this.width, this.height);
    }

    resize() {
        // Add particles to the new parts of the canvas.
        const divWidth = this.ctx.canvas.width - this.width,
              divHeight = this.ctx.canvas.height - this.height;

        if(divWidth > 0) this.spawnParticles(this.width, 0, divWidth, this.height);
        if(divHeight > 0) this.spawnParticles(0, this.height, this.width, divHeight);
        if(divWidth > 0 || divHeight > 0) this.spawnParticles(this.width, this.height, divWidth, divHeight);

        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;

        // Remove particles that are out of bounds of the new canvas to improve performance.
        const width = this.width,
              height = this.height;
        this.particles = this.particles.filter(function(p){
            return !(p.x < 0 || p.x > width || p.y < 0 || p.y > height);
        });
    }

    mouseAction(cords, event) {
        if(event === "down"){
            this.mouseDown = true;
            this.mouseParticle.color = Utils.randomChoice(this.colors, this.rand);
        }
        else if(event === "up") this.mouseDown = false;
        else if(event === "down" || (event === "move" && this.mouseDown)){
            this.mouseParticle.x = cords.x;
            this.mouseParticle.y = cords.y;
        }
    }

    getSettings() {
        return [{prop: "particlesDensity", type: "float", step: 0.0001, min: 0.0001, max: 0.002, toCall: "restart"},
                {prop: "fillTriangles", type: "bool"},
                {prop: "drawParticles", type: "bool"},
                {prop: "distanceThreshold", type: "int", min: 0, max: 200},
                {prop: "speed", icon: '<i class="fa-solid fa-gauge-high"></i>', type: "float", step: 0.1, min: -4, max: 4},
                {prop: "addAParticle", type: "text", value: "<hold mouse button/touch>"},
                this.getSeedSettings()];
    }
}

module.exports = Network;
