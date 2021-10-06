/*
 * Shapes moving in a circle with
 * Based on: https://observablehq.com/@rreusser/instanced-webgl-circles
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class SpinningShapes extends Animation {
    constructor (canvas, colors, colorsAlt, shapes = 500, sides = [0], rotatePolygons = false) {
        super(canvas, colors, colorsAlt, "", "spinning-shapes.js");

        const shapeSides = [0, 3, 4, 5, 6, 8];
        const shapeNames = ["circles", "triangles", "rectangles", "pentagons", "hexagons", "octagons"];
        this.sides = Utils.randomChoice(sides);
        this.rotatePolygons = rotatePolygons;
        this.shapes = shapes;
        this.name = shapeNames[shapeSides.indexOf(this.sides)] + " moving in a circle";

        this.time = 0;

        this.distBase = 0.6;
        this.distVar = 0.2;
        this.sizeBase = 0.2;
        this.sizeVar = 0.12;
    }

    update(timeElapsed){
        this.time += timeElapsed / 1000;
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        const centerX = this.ctx.canvas.width / 2,
              centerY = this.ctx.canvas.height / 2,
              scale = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3;

        for (let i = 0; i < this.shapes; ++i) {
            const theta = i / this.shapes * 2 * Math.PI,
                  distance = (this.distBase + this.distVar * Math.cos(theta * 6 + Math.cos(theta * 8 + this.time / 2))) * scale,
                  x = centerX + Math.cos(theta) * distance,
                  y = centerY + Math.sin(theta) * distance,
                  radius = (this.sizeBase + this.sizeVar * Math.cos(theta * 9 - this.time)) * scale;
            this.ctx.strokeStyle = this.colors[Math.floor((Math.cos(theta * 9 - this.time) + 1) / 2 * this.colors.length)];
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            if(this.sides == 0) Utils.pathCircle(this.ctx, x, y, radius);
            else Utils.pathPolygon(this.ctx, x, y, radius, this.sides, theta * this.rotatePolygons);
            this.ctx.stroke();
        }
    }
}

module.exports = SpinningShapes
