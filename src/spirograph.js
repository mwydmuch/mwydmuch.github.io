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
    constructor (canvas, colors, colorsAlt, points = 2500, gearCount = "random") {
        super(canvas, colors, colorsAlt, "spirograph", "spirograph.js");

        this.points = points;
        this.maxGears = 5;
        this.gearCount = this.assignAndCheckIfRandom(gearCount, Utils.randomInt(2, this.maxGears));
        this.gearNames = ["zero", "one", "two", "three", "four", "five"];
        this.updateName();
        this.gears = [];
        for (let i = 0; i < this.maxGears; ++i) {
            this.gears.push({
                radius: Utils.round(Utils.randomRange(0, 100), 2),
                rate: Utils.round(Utils.randomRange(-100, 100), 2),
                phase: i * 0.005
            });
        }
    }

    updateName(){
        this.name = "spirograph with " + this.gearNames[this.gearCount] + " random gears";
    }

    getXY(i, j, scale = 1){
        let x = 0, y = 0;

        for(let k = 0; k < this.gearCount; ++k){
            const g = this.gears[k];
            x += g.radius * scale * Math.cos(g.rate * (i + j * g.phase));
            y += g.radius * scale * Math.sin(g.rate * (i + j * g.phase));
        }

        return {x: x, y: y}
    }

    draw() {
        Utils.clear(this.ctx, this.bgColor);

        // Normalize size to fit the screen nicely
        let totalRadius = 0;
        for(let i = 0; i < this.gearCount; ++i) totalRadius += this.gears[i].radius;
        const scale = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2 / totalRadius;

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        const incr = Math.PI * 2 / this.points;
        let start = this.getXY(0, this.time, scale);

        for (let i = incr; i <= Math.PI * 2; i += incr) {
            let next = this.getXY(i, this.time, scale);
            const color = Utils.lerpColor(this.colorA, this.colorB, i / (Math.PI * 2));
            Utils.drawLine(this.ctx, start.x, start.y, next.x, next.y, color, 1);
            start = next;
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        let settings = [{
            "prop": "points",
            "type": "int",
            "min": 100,
            "max": 5000,
        }, {
            "prop": "gearCount",
            "type": "int",
            "min": 1,
            "max": this.maxGears,
            "toCall": "updateName"
        }];
        for(let i = 0; i < this.maxGears; ++i){
            settings = settings.concat([{
                "prop": `gears[${i}].radius`,
                "type": "float",
                "step": 0.01,
                "min": 0,
                "max": 100,
            }, {
                "prop": `gears[${i}].rate`,
                "type": "float",
                "step": 0.01,
                "min": -100,
                "max": 100,
            }, {
                "prop": `gears[${i}].phase`,
                "type": "float",
                "step": 0.001,
                "min": -0.1,
                "max": 0.1,
            }]);
        }
        return settings;
    }
}

module.exports = Spirograph
