/*
*
* Makes use of a delaunay algorithm to create crystal-like shapes.
* The delaunay library was developed by Jay LaPorte at https://github.com/ironwallaby/delaunay/blob/master/delaunay.js
*
* Inspired by: https://openprocessing.org/sketch/413567/
*/


const Animation = require("./../animation");
const Utils = require("./../utils");
const Delaunay = require("./delaunay");

class Cristals extends Animation {
    constructor(canvas, colors, colorsAlt,
                charSize = 20,
                tabSize = 4) {
        super(canvas, colors, colorsAlt, "Code writing animation", "codding.js");

        this.particles = [];
        this.maxLevel = 5;
        this.useFill = false;
        this.distThr = 75;
    }

    drawTriangle(p1, p2, p3){
        // Don't draw triangle if its area is too big.
        if (Utils.distVec2d(p1, p2) > this.distThr
            || Utils.distVec2d(p1, p2) > this.distThr
            || Utils.distVec2d(p1, p2) > this.distThr) return;

        Utils.pathClosedShape(this.ctx, [p1, p2, p3]);
        const color = `hls(${165+p1.life*1.5}, 360, 360`;
        if(this.useFill){
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }

    createParticle(x, y,)

    draw() {
        this.fadeOut(0.3);

        for (var i = this.particles.length-1; i > -1; i--) {
            let p = this.particles[i];
            ++p.life;
            p.velX *= 0.9;
            p.velY *= 0.9;


            this.move = function() {
                this.life++;


                // Add friction.
                this.vel.mult(0.9);

                this.pos.add(this.vel);

                // Spawn a new particle if conditions are met.
                if (this.life % 10 == 0) {
                    if (this.level > 0) {
                        this.level -= 1;
                        var newParticle = new Particle(this.pos.x, this.pos.y, this.level-1);
                        this.particles.push(newParticle);
                    }
                }
            }

            if (Utils.magVec2d(this.particles[i].vel < 0.01)) this.particles.splice(i, 1);
        }

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
    }
}

module.exports = Cristals;


// Moves to a random direction and comes to a stop.
// Spawns other particles within its lifetime.
function Particle(x, y, level) {
    this.level = level;
    this.life = 0;

    this.pos = new p5.Vector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(map(this.level, 0, maxLevel, 5, 2));

    this.move = function() {
        this.life++;

        // Add friction.
        this.vel.mult(0.9);

        this.pos.add(this.vel);

        // Spawn a new particle if conditions are met.
        if (this.life % 10 == 0) {
            if (this.level > 0) {
                this.level -= 1;
                var newParticle = new Particle(this.pos.x, this.pos.y, this.level-1);
                this.particles.push(newParticle);
            }
        }
    }
}
