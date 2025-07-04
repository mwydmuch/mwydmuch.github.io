'use strict';

const NAME = "shapes dancing in a circle",
      FILE = "spinning-shapes.js",
      DESC = `
Just same shape "dancing" in a circle.
This animation recreates the effect 
described in this [article](https://observablehq.com/@rreusser/instanced-webgl-circles).

Coded by me (Marek Wydmuch) in 2021, with no external dependencies, using only canvas API.
`;

const Animation = require("../animation");
const Utils = require("../utils");

class SpinningShapes extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor, 
                 shapes = 500,
                 vertices = 0,
                 rotateShapes = false,
                 scale = 1,
                 colorsScale = 1,
                 colorsShift = "random",
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.shapeNames = ["circles", "points", "lines", "triangles", "rectangles", "pentagons", "hexagons", "heptagons", "octagons"];
        this.vertices = this.assignIfRandom(vertices, Utils.randomInt(0, 8));
        this.updateName();
        this.rotateShapes = rotateShapes;
        this.shapes = shapes;

        this.distanceBase = 0.6;
        this.distanceRange = 0.2;
        this.sizeBase = 0.2;
        this.sizeRange = 0.12;

        this.scale = scale;
        this.colorsScale = colorsScale;
        this.colorsShift = this.assignIfRandom(colorsShift, Utils.randomChoice([0, 3.14]));
        this.rainbowColors = rainbowColors;
    }

    updateName(){
        this.name = this.shapeNames[this.vertices] + " \"dancing\" in a circle";
    }

    draw() {
        this.clear();

        const scale = Math.max(this.canvas.width, this.canvas.height) / 3 * this.scale;

        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

        for (let i = 0; i < this.shapes; ++i) {
            const theta = i / this.shapes * 2 * Math.PI,
                  distance = (this.distanceBase + this.distanceRange * Math.cos(theta * 6 + Math.cos(theta * 8 + this.time / 2))) * scale,
                  x = Math.cos(theta) * distance,
                  y = Math.sin(theta) * distance,
                  theta9 = theta * 9 - this.time,
                  radius = (this.sizeBase + this.sizeRange * Math.cos(theta9)) * scale,
                  color = (Math.cos((theta9 + this.colorsShift) * this.colorsScale) + 1) / 2;
            if(this.rainbowColors) this.ctx.strokeStyle = `hsl(${color * 360}, 100%, 75%)`;
            else this.ctx.strokeStyle = Utils.lerpColor(this.colorA, this.colorB, color);
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            if(this.vertices === 0) Utils.pathCircle(this.ctx, x, y, radius);
            if(this.vertices === 1) Utils.pathCircle(this.ctx, x, y, 1);
            else Utils.pathPolygon(this.ctx, x, y, radius, this.vertices, theta * this.rotateShapes);
            this.ctx.stroke();
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "vertices", icon: '<i class="fa-solid fa-shapes"></i>', name: "vertices per shape", type: "int", min: 0, max: 8, toCall: "updateName"},
                {prop: "shapes", name: "number of shapes", type: "int", min: 0, max: 2500},
                {prop: "rotateShapes", icon: '<i class="fa-solid fa-rotate"></i>', type: "bool" },
                {prop: "distanceRange", type: "float", min: 0, max: this.distanceBase},
                {prop: "sizeRange", type: "float", min: 0, max: this.sizeBase},
                {prop: "scale", icon: '<i class="fa-solid fa-maximize"></i>', type: "float", min: 0.05, max: 1.95},
                {prop: "speed", icon: '<i class="fa-solid fa-gauge-high"></i>', type: "float", step: 0.1, min: -4, max: 4},
                {prop: "colorsShift", type: "float", min: 0, max: 3.14},
                {prop: "colorsScale", type: "float", min: 0.05, max: 2},
                {prop: "rainbowColors", icon: '<i class="fa-solid fa-rainbow"></i>', type: "bool"}];
    }
}

module.exports = SpinningShapes
