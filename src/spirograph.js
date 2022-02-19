/*
 * Spirograph created with 2-4 random gears.
 * See: https://en.wikipedia.org/wiki/Spirograph,
 * and: http://www.eddaardvark.co.uk/v2/spirograph/spirograph2.html (this site is amazing).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class Spirograph extends Animation {
    constructor (canvas, colors, colorsAlt, points = 2500) {
        super(canvas, colors, colorsAlt, "spirograph", "spirograph.js");

        this.points = points;
        this.gears = []
        const gearCount = Utils.randomInt(2, 5),
              gearNames = ["one", "two", "three", "four", "five", "six"];
        this.name = "spirograph with " + gearNames[gearCount] + " random gears"
        for(let i = 0; i < gearCount; ++i){
            this.gears.push({
                r: Utils.randomRange(0, 100),
                rate: Utils.randomRange(-100, 100),
                phase: i * 0.005
            });
        }
    }

    get_x_y(i, j, scale = 1){
        let x = 0, y = 0;

        for(let g of this.gears){
            x += g.r * scale * Math.cos(g.rate * (i + j * g.phase));
            y += g.r * scale * Math.sin(g.rate * (i + j * g.phase));
        }

        return {x: x, y: y}
    }

    draw() {
        Utils.clear(this.ctx, this.bgColor);

        let r = 0;
        for(let g of this.gears) r += g.r;
        const scale = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 / r;

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        const incr = Math.PI * 2 / this.points;
        let start = this.get_x_y(0, this.time, scale);

        for (let i = incr; i <= Math.PI * 2; i += incr) {
            let next = this.get_x_y(i, this.time, scale);
            const color = Utils.lerpColor(this.colorA, this.colorB, i / (Math.PI * 2));
            Utils.drawLine(this.ctx, start.x, start.y, next.x, next.y, color, 1);
            start = next;
        }

        this.ctx.resetTransform();
    }
}

module.exports = Spirograph
