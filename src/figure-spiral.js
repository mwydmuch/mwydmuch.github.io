'use strict';

/*
 * Very simple of figures spinning in the spiral.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class FigureSpiral extends Animation {
    constructor(canvas, colors, colorsAlt,
                number = 500,
                size = 50,
                sides = "random") {
        super(canvas, colors, colorsAlt, "", "figure-spiral.js");

        this.shapeSides = [0, 1, 2, 3, 4, 5, 6, 8];
        this.shapeNames = ["circles", "points", "lines", "triangles", "rectangles", "pentagons", "hexagons", "octagons"];
        this.sides = this.assignIfRandom(sides, Utils.randomChoice(this.shapeSides));
        this.updateName();
        this.size = size;
        this.number = number;
    }

    updateName(){
        this.name = this.shapeNames[this.shapeSides.indexOf(this.sides)] + " spinning in spiral";
    }

    draw() {
        this.clear();
        this.ctx.translate(this.ctx.canvas.width / 2,  this.ctx.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.strokeStyle = this.colors[0];

        for (let i = 0; i < this.number; ++i) {
            this.ctx.rotate(Math.PI * (this.time * 0.001 + i * 0.000001));
            this.ctx.beginPath();
            if (this.sides === 0) Utils.pathCircle(this.ctx, i, i, this.size);
            if (this.sides === 1) Utils.pathCircle(this.ctx, i, i, 1);
            else Utils.pathPolygon(this.ctx, i, i, this.size, this.sides, 0);
            this.ctx.stroke();
        }
        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "sides", type: "int", min: 0, max: 8, toCall: "updateName"},
                {prop: "number", type: "int", min: 1, max: 1024},
                {prop: "size", type: "int", min: 1, max: 128},
                {prop: "speed", type: "float", step: 0.1, min: -4, max: 4}];
    }
}

module.exports = FigureSpiral;
