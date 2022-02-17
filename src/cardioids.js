/*
 * Modified method of L. Cremona for drawing cardioid with a pencil of lines,
 * as described in section "Cardioid as envelope of a pencil of lines" of:
 * https://en.wikipedia.org/wiki/Cardioid
 * Here the shift of the second point is determined by time passed
 * from the beginning of the animation.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class Cardioids extends Animation {
    constructor (canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "cardioids with a pencil of lines", "cardioids.js");

        this.lines = 400;
        this.radius = 0;
    }

    getVec(i){
        const angle = Utils.remap(i, 0, this.lines, 0, 2 * Math.PI);
        return Utils.rotateVec2d(Utils.createVec2d(this.radius, 0), Math.PI + angle);
    }

    draw() {
        Utils.clear(this.ctx, this.bgColor);

        this.radius = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3;
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        Utils.strokeCircle(this.ctx, 0, 0, this.radius, this.colors[0]);

        for (let i = 0; i <= this.lines; ++i) {
            const a = this.getVec(i),
                  b = this.getVec(i * this.time * 0.05),
                  color = Utils.lerpColorsPallet([this.colorA, this.colorB, this.colorA], i / this.lines);
            //    color = 'hsl(' + i / this.lines * 360 + ', 100%, 75%)';
            Utils.drawLine(this.ctx, a.x, a.y, b.x, b.y, color, 1);
        }

        this.ctx.resetTransform();
    }
}

module.exports = Cardioids
