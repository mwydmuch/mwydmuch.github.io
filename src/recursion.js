'use strict';

const NAME = "recursion",
      FILE = "recursion.js",
      DESC = `
Recursion animation.
`;

const Animation = require("./animation");
const AnimationQueue = require("./animation-queue");
const Utils = require("./utils");


class RecursiveRect {
    constructor(depth, rand) {
        this.depth = depth;
        this.rand = rand;

        this.animQueue = new AnimationQueue();
        this.children = [];
        this.positions = {
            0: {x: 0, y: 0, from: [1, 2]},
            1: {x: 1, y: 0, from: [0, 3]},
            2: {x: 0, y: 1, from: [0, 3]},
            3: {x: 1, y: 1, from: [1, 2]},
        }

        if(depth > 0){
            this.children = [
                {object: new RecursiveRect(depth - 1, this.rand), position: 0},
                {object: new RecursiveRect(depth - 1, this.rand), position: 1},
                {object: new RecursiveRect(depth - 1, this.rand), position: 2},
            ];

            for(let c of this.children){
                c["x"] = this.positions[c.position]["x"];
                c["y"] = this.positions[c.position]["y"];
            }
        }
    }  

    update(elapsed) {
        for(let c of this.children){
            c.object.update(elapsed);
        }

        if(this.children.length === 0) return;

        while(this.animQueue.step(elapsed) > 0){
            let takenPositions = new Set();
            for(let c of this.children) takenPositions.add(c.position);
            const freePositions = new Set([0, 1, 2, 3]),
                  freePosition = Utils.setsDifference(freePositions, takenPositions).values().next().value,
                  newPos = this.positions[freePosition],
                  positionToMove = Utils.randomChoice(newPos.from, this.rand);
            
                  let objectToMove = null;
            for(let c of this.children){
                if(c.position == positionToMove){
                    objectToMove = c;
                    break;
                }
            }

            //console.log(this.depth, elapsed, takenPositions, freePositions, freePosition, positionToMove, objectToMove);

            const oldPos = this.positions[objectToMove.position],
                  duration = this.depth / 2;
            objectToMove.position = freePosition;

            const posEasing = Utils.easeInOutSine;
            this.animQueue.push(function (time) {
                const prog = Math.min(time, duration) / duration;
                objectToMove.x = Utils.lerp(oldPos.x, newPos.x, posEasing(prog));
                objectToMove.y = Utils.lerp(oldPos.y, newPos.y, posEasing(prog));
                return time - duration;
            });
        }
    }

    draw(ctx, size) {
        const nextSize = size / 2;
        ctx.strokeRect(-0.5 * size, -0.5 * size, size, size);
        for(let c of this.children){
            ctx.save();
            ctx.translate((-0.5 + c.x) * nextSize, (-0.5 + c.y) * nextSize);
            c.object.draw(ctx, nextSize);
            ctx.restore();
        }
    }
}

class Recursion extends Animation {
    constructor(canvas, colors, colorsAlt, depth = 9, speed = 1) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.depth = depth;
        this.speed = speed;
        this.object = new RecursiveRect(this.depth, this.rand);
    }

    update(elapsed) {
        elapsed /= 1000;
        elapsed *= this.speed;
        this.time += elapsed;
        ++this.frame;

        this.object.update(elapsed);
    }

    draw() {
        this.clear();
        const size = Math.max(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.strokeStyle = this.colors[0];
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.object.draw(this.ctx, size);
        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "speed", type: "float", step: 0.25, min: 0.5, max: 8},
                this.getSeedSettings()];
    }
}

module.exports = Recursion;
