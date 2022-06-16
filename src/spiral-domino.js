'use strict';

/*
 * Work in progress.
 *
 * Spiral domino animation.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class SpiralDomino extends Animation {
    constructor (canvas, colors, colorsAlt){
        super(canvas, colors, colorsAlt, "spiral domino", "spiral-domino.js");
        this.particles = 1000;
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        const centerX = this.ctx.canvas.width / 2,
              centerY = this.ctx.canvas.height / 2;

        for(let i = 1; i <= this.particles; i++){
            const r = 2 * i,
                  p = 5 * i * Math.PI / 180,
                  x = centerX + Math.cos(p) * r,
                  y = centerY + Math.sin(p) * r;

            const r2 = 2 * (i - 1),
                p2 = 5 * (i - 1) * Math.PI / 180,
                x2 = centerX + Math.cos(p2) * r2,
                y2 = centerY + Math.sin(p2) * r2;

            let v = Utils.rotateVec2d(Utils.createVec2d(36, 0), this.time + p);

            Utils.drawLine(this.ctx, x - v.x, y - v.y, x + v.x, y + v.y, this.colorsAlt[0]);

            Utils.drawLine(this.ctx, x2, y2, x, y, this.colors[0]);
        }
    }
}

module.exports = SpiralDomino;
