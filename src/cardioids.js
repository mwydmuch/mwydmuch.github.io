/*
 * Modified method of L. Cremona for drawing cardioid with a pencil of lines,
 * as described in section "cardioid as envelope of a pencil of lines" of:
 * https://en.wikipedia.org/wiki/Cardioid
 * Here the shift of the second point is determined by time passed
 * from the beginning of the animation.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class Cardioids extends Animation {
    constructor (canvas, colors, colorsAlt,
                 lines = 400,
                 scale = 1.0,
                 speed = 0.05,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, "cardioids with a pencil of lines", "cardioids.js");

        this.lines = lines;
        this.scale = scale;
        this.speed = speed;
        this.rainbowColors = rainbowColors;

        this.radius = 0;
        this.position = 0;
    }

    getVec(i){
        const angle = Utils.remap(i, 0, this.lines, 0, 2 * Math.PI);
        return Utils.rotateVec2d(Utils.createVec2d(this.radius, 0), Math.PI + angle);
    }

    update(elapsed){
        this.time += elapsed / 1000;
        ++this.frame;
        this.position += elapsed / 1000 * this.speed;
    }

    draw() {
        this.clear();

        this.radius = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3 * this.scale;
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        Utils.strokeCircle(this.ctx, 0, 0, this.radius, this.colors[0]);

        for (let i = 0; i <= this.lines; ++i) {
            const a = this.getVec(i),
                  b = this.getVec(i * this.position);
            let color;
            if(this.rainbowColors) color = 'hsl(' + i / this.lines * 360 + ', 100%, 75%)';
            else color = Utils.lerpColorsPallet([this.colorA, this.colorB, this.colorA], i / this.lines);
            Utils.drawLine(this.ctx, a.x, a.y, b.x, b.y, color, 1);
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "lines", type: "int", min: 1, max: 2500},
                {prop: "speed", type: "float", min: -1.0, max: 1.0},
                {prop: "scale", type: "float", min: 0.25, max: 1.75},
                {prop: "rainbowColors", type: "bool"}];
    }
}

module.exports = Cardioids
