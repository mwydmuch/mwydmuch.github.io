/*
 * Shapes moving in a circle.
 * Based on: https://observablehq.com/@rreusser/instanced-webgl-circles
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class SpinningShapes extends Animation {
    constructor (canvas, colors, colorsAlt, 
                 shapes = 500, 
                 sides = [0], 
                 rotateShapes = false,
                 scale = 1) {
        super(canvas, colors, colorsAlt, "", "spinning-shapes.js");

        const shapeSides = [0, 3, 4, 5, 6, 8];
        const shapeNames = ["circles", "triangles", "rectangles", "pentagons", "hexagons", "octagons"];
        this.sides = Utils.randomChoice(sides);
        this.rotateShapes = rotateShapes;
        this.shapes = shapes;
        this.name = shapeNames[shapeSides.indexOf(this.sides)] + " moving in a circle";

        this.distBase = 0.6;
        this.distVar = 0.2;
        this.sizeBase = 0.2;
        this.sizeVar = 0.12;

        this.scale = scale;
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        const scale = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3 * this.scale;

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        for (let i = 0; i < this.shapes; ++i) {
            const theta = i / this.shapes * 2 * Math.PI,
                  distance = (this.distBase + this.distVar * Math.cos(theta * 6 + Math.cos(theta * 8 + this.time / 2))) * scale,
                  x = Math.cos(theta) * distance,
                  y = Math.sin(theta) * distance,
                  radius = (this.sizeBase + this.sizeVar * Math.cos(theta * 9 - this.time)) * scale;
            this.ctx.strokeStyle = Utils.lerpColor(this.colorA, this.colorB,(Math.cos(theta * 9 - this.time) + 1) / 2); // New with smooth color transition
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            if(this.sides == 0) Utils.pathCircle(this.ctx, x, y, radius);
            else Utils.pathPolygon(this.ctx, x, y, radius, this.sides, theta * this.rotateShapes);
            this.ctx.stroke();
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{
            "prop": "sides",
            "type": "int",
            "min": 0,
            "max": 8,
        }, {
            "prop": "shapes",
            "type": "int",
            "min": 0,
            "max": 2500,
        }, {
            "prop": "rotateShapes",
            "type": "bool",
        }, {
            "prop": "scale",
            "type": "float",
            "min": 0.05,
            "max": 1.95,
            "toCall": "resize",
        }];
    }
}

module.exports = SpinningShapes
