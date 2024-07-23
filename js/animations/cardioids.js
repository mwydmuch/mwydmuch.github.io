'use strict';

const NAME = "cardioids with a pencil of lines",
      FILE = "cardioids.js",
      DESC = `
Modified method of L. Cremona for drawing cardioid with a pencil of lines,
as described in section "cardioid as envelope of a pencil of lines" 
of this Wikipedia [article](https://en.wikipedia.org/wiki/Cardioid).

Here the shift of the second point for each line is determined by time passed
from the beginning of the animation.

To see what is really happening, try to set the number of lines to small number.

Playing with both number of lines and speed, allow to notice different interesting patterns.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("../animation");
const Utils = require("../utils");

class Cardioids extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor,
                 lines = 400,
                 scale = 1.0,
                 speed = 0.05,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.lines = lines;
        this.scale = scale;
        this.speed = speed;
        this.rainbowColors = rainbowColors;
        this.radius = 0;
    }

    getVec(i){
        const angle = Utils.remap(i, 0, this.lines, 0, 2 * Math.PI);
        return Utils.rotateVec2d(Utils.createVec2d(this.radius, 0), Math.PI + angle);
    }

    draw() {
        this.clear();

        this.radius = Math.max(this.canvas.width, this.canvas.height) / 3 * this.scale;
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        Utils.strokeCircle(this.ctx, 0, 0, this.radius, this.colors[0]);

        for (let i = 0; i <= this.lines; ++i) {
            const a = this.getVec(i),
                  b = this.getVec(i * this.time);
            let color;
            if(this.rainbowColors) color = 'hsl(' + i / this.lines * 360 + ', 100%, 75%)';
            else color = Utils.lerpColorsPallet([this.colorA, this.colorB, this.colorA], i / this.lines);
            this.ctx.strokeStyle = color;
            Utils.drawLine(this.ctx, a.x, a.y, b.x, b.y, 1, color);
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "lines", name: "number of lines", type: "int", min: 1, max: 2500},
                {prop: "speed", icon: '<i class="fa-solid fa-gauge-high"></i>', type: "float", min: -2.0, max: 2.0},
                {prop: "scale", icon: '<i class="fa-solid fa-maximize"></i>', type: "float", min: 0.25, max: 1.75},
                {prop: "rainbowColors", icon: '<i class="fa-solid fa-rainbow"></i>', type: "bool"}];
    }
}

module.exports = Cardioids
