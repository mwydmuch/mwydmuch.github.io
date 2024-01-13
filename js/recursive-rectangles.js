'use strict';

const NAME = "recursive rectangles",
      FILE = "recursion-rectangles.js",
      DESC = `
Simple recursive animation. 
Each rectangle contains three smaller rectangles, which move around.
One randomly chosen rectangle is always moving to the empty space.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const AnimationQueue = require("./animation-queue");
const Utils = require("./utils");


class RecursiveRectangle {
    constructor(depth, rand) {
        this.depth = null;
        this.rand = rand;
        this.animQueue = new AnimationQueue();
        this.children = [];
        this.positions = {
            0: {x: 0, y: 0, from: [1, 2]},
            1: {x: 1, y: 0, from: [0, 3]},
            2: {x: 0, y: 1, from: [0, 3]},
            3: {x: 1, y: 1, from: [1, 2]},
        }

        this.setDepth(depth);
    }

    update(elapsed) {
        if(this.children.length === 0) return;

        for(let c of this.children){
            c.object.update(elapsed);
        }

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

    setDepth(depth) {
        if(depth === 0 && this.children.length){
            this.children = [];
            this.animQueue.clear();
        }
        else if(depth > 0){
            if (this.children.length === 0){
                this.children = [
                    {object: new RecursiveRectangle(depth - 1, this.rand), position: 0},
                    {object: new RecursiveRectangle(depth - 1, this.rand), position: 1},
                    {object: new RecursiveRectangle(depth - 1, this.rand), position: 2},
                ];
    
                for(let c of this.children){
                    c["x"] = this.positions[c.position]["x"];
                    c["y"] = this.positions[c.position]["y"];
                }
            } else {
                for(let c of this.children) c.object.setDepth(depth - 1);
            }
        }
        this.depth = depth;
    }

    draw(ctx, size) {
        const nextSize = size / 2;
        if(this.children.length === 0){
            ctx.strokeRect(-0.5 * size, -0.5 * size, nextSize, nextSize);
            ctx.strokeRect(0, -0.5 * size, nextSize, nextSize);
            ctx.strokeRect(-0.5 * size, 0, nextSize, nextSize);
            ctx.strokeRect(0, 0, nextSize, nextSize);
        }
        else {
            ctx.strokeRect(-0.5 * size, -0.5 * size, size, size);
            for(let c of this.children){
                ctx.save();
                ctx.translate((-0.5 + c.x) * nextSize, (-0.5 + c.y) * nextSize);
                c.object.draw(ctx, nextSize);
                ctx.restore();
            }
        }
    }
}

class RecursiveRectangles extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor, depth = 7, speed = 1, contain = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.depth = depth;
        this.speed = speed;
        this.contain = contain;
        this.object = new RecursiveRectangle(this.depth, this.rand);
    }

    update(elapsed) {
        elapsed /= 1000;
        elapsed *= this.speed;
        this.object.update(elapsed);
    }

    draw() {
        this.clear();
        let size = 0;
        if(this.contain){
            size = Math.min(this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.translate((this.ctx.canvas.width - size) / 2, (this.ctx.canvas.height - size) / 2);
        }
        else size = Math.max(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];
        this.ctx.fillStyle = this.colors[0];
        this.ctx.translate(size / 2, size / 2);
        this.object.draw(this.ctx, size);
        this.ctx.resetTransform();
    }

    updateDepth() {
        this.object.setDepth(this.depth);
    }

    getSettings() {
        return [{prop: "depth", type: "int", min: 2, max: 9, toCall: "updateDepth"},
                {prop: "speed", type: "float", step: 0.25, min: 0.5, max: 8},
                {prop: "contain", type: "bool"},
                this.getSeedSettings()];
    }
}

module.exports = RecursiveRectangles;
