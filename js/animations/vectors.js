'use strict';

const NAME = "vectors",
      FILE = "vectors.js",
      DESC = `
Vectors.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("../animation");
const Utils = require("../utils");

class Vectors extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                distance = 64) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.distance = distance;
        this.mouseRange = 2 * distance;
        this.dashLenght = 16;
        this.mousePoint = Utils.createVec2d(0, 0);
    }

    draw() {
        this.clear();
        this.ctx.translate(this.ctx.canvas.width / 2,  this.ctx.canvas.height / 2);

        const pointsHori = Math.floor(this.ctx.canvas.width / this.distance),
              pointsVert = Math.floor(this.ctx.canvas.height / this.distance);

        let startPoints = [],
            endPoints = [];
        for (let i = 0.0; i < pointsHori; ++i) {
            for (let j = 0.0; j < pointsVert; ++j) {
                const x = (i - (pointsHori - 1) / 2) * this.distance,
                      y = (j - (pointsVert - 1) / 2) * this.distance,
                      point = Utils.createVec2d(x, y);
                startPoints.push(point);
                if(Utils.distVec2d(this.mousePoint, point) < this.mouseRange) endPoints.push(point);
            }
        }

        this.ctx.strokeStyle = this.colors[0];
        this.ctx.setLineDash([this.dashLenght]);
        this.ctx.lineDashOffset = -this.dashLenght * (this.time % 30);

        for(let p1 of startPoints) {
            for(let p2 of endPoints) {
                Utils.drawLine(this.ctx, p1.x, p1.y, p2.x, p2.y, 0.25);
            }
        }

        this.ctx.setLineDash([]);
        this.ctx.resetTransform();
    }

    mouseAction(cords, event) {
        if(event === "move"){
            this.mousePoint = Utils.createVec2d(cords.x - this.ctx.canvas.width / 2, cords.y - this.ctx.canvas.height / 2);
        }
    }

    getSettings() {
        return [{prop: "distance", type: "int", min: 32, max: 256},
                {prop: "mouseRange", type: "int", min: 32, max: 512}];
    }
}

module.exports = Vectors;
