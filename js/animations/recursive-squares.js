'use strict';

const NAME = "recursive squares",
      FILE = "recursion-squares.js",
      DESC = `
Simple recursive animation. 
Each rectangle contains three smaller squares, which move around.
One randomly chosen rectangle is always moving to the empty space.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("../animation");
const AnimationQueue = require("../animation-queue");
const Utils = require("../utils");


class RecursiveSquare {
    constructor(x, y, squaresPerSide, depth, rand) {
        this.x = x;
        this.y = y;
        this.squaresPerSide = squaresPerSide;
        this.squares = squaresPerSide * squaresPerSide;
        this.depth = depth;
        this.rand = rand;
        this.createChildren();
    }

    createChildren(){
        this.animQueue = new AnimationQueue();
        this.children = [];
        this.positions = [];
        this.freePosIdx = this.squares - 1;
        this.prevFreePosIdx = this.squares - 1; 
    
        for(let x = 0; x < this.squaresPerSide; ++x){
            for(let y = 0; y < this.squaresPerSide; ++y){
                const posIdx = y * this.squaresPerSide + x,
                      normX = x / this.squaresPerSide,
                      normY = y / this.squaresPerSide;

                let neighbors = [];
                if(x - 1 >= 0) neighbors.push(posIdx - 1);
                if(x + 1 < this.squaresPerSide) neighbors.push(posIdx + 1);
                if(y - 1 >= 0) neighbors.push(posIdx - this.squaresPerSide);
                if(y + 1 < this.squaresPerSide) neighbors.push(posIdx + this.squaresPerSide);
                
                this.positions[posIdx] = {
                    x: normX, 
                    y: normY, 
                    neighbors: neighbors,
                }

                if(x == this.squaresPerSide - 1 && y == this.squaresPerSide - 1 || this.depth == 0) continue;

                let child = new RecursiveSquare(normX, normY, this.squaresPerSide, this.depth - 1, this.rand);
                this.positions[posIdx]['child'] = child;
                this.children.push(child);
            }
        }
    }

    update(elapsed) {
        if(this.children.length === 0) return;

        for(let c of this.children) c.update(elapsed);

        while(this.animQueue.step(elapsed) > 0){
            const newPos = this.positions[this.freePosIdx];
            
            let posToMoveIdx = this.prevFreePosIdx;
            while(posToMoveIdx === this.prevFreePosIdx) 
                posToMoveIdx = Utils.randomChoice(newPos.neighbors, this.rand);

            const oldPos = this.positions[posToMoveIdx],
                  childToMove = oldPos.child,
                  duration = this.depth / 2;
            
            oldPos.child = null;
            newPos.child = childToMove;
            this.prevFreePosIdx = this.freePosIdx;
            this.freePosIdx = posToMoveIdx;

            const posEasing = Utils.easeInOutSine;
            this.animQueue.push(function (time) {
                const prog = Math.min(time, duration) / duration;
                childToMove.x = Utils.lerp(oldPos.x, newPos.x, posEasing(prog));
                childToMove.y = Utils.lerp(oldPos.y, newPos.y, posEasing(prog));
                return time - duration;
            });
        }
    }

    draw(ctx, size, padded, fill) {
        if (!fill && !padded) ctx.strokeRect(0, 0, size, size);
        if(this.children.length === 0){
            if(padded){
                if(!fill) ctx.strokeRect(4, 4, size - 4, size - 4); 
                else ctx.fillRect(2, 2, size - 2, size - 2); 
            }
        } else {
            for(let c of this.children){
                ctx.save();
                ctx.translate(c.x * size, c.y * size);
                c.draw(ctx, size / this.squaresPerSide, padded, fill);
                ctx.restore();
            }
        }
    }
}

class RecursiveSquares extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor, 
                squaresPerSide = 5,
                depth = 3, 
                speed = 1, 
                squareStyle = "padded stroke", 
                contain = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.squaresPerSide = squaresPerSide;
        this.depth = depth;
        this.speed = speed;
        this.squareStyles = ["padded fill", "padded stroke", "stroke"];
        this.squareStyle = this.assignIfRandom(squareStyle, Utils.randomChoice(this.squareStyles));
        this.contain = contain;
        this.createSquares();
    }

    createSquares() {
        // This is needed to prevent to depth recursion, that may freze user brower (especially Firefox)
        let depth = this.depth;
        while(Math.pow(this.squaresPerSide, depth + 1) > 2048) --depth; 

        this.mainSquare = new RecursiveSquare(0, 0, this.squaresPerSide, depth, this.rand);
    }

    update(elapsed) {
        elapsed /= 1000;
        elapsed *= this.speed;
        this.mainSquare.update(elapsed);
    }

    draw() {
        this.clear();
        let size = 0,
            fill = false,
            padding = false;

        if(this.contain){
            size = Math.min(this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.translate((this.ctx.canvas.width - size) / 2, (this.ctx.canvas.height - size) / 2);
        }
        else size = Math.max(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.lineWidth = 1;
        if(this.squareStyle === "padded stroke") this.ctx.lineWidth = 2;
        if(this.squareStyle.startsWith("padded")) padding = true;
        if(this.squareStyle === "padded fill") fill = true;
        
        this.ctx.strokeStyle = this.colors[0];
        this.ctx.fillStyle = this.colors[0];
        this.mainSquare.draw(this.ctx, size, padding, fill);
        this.ctx.resetTransform();
    }

    restart(){
        super.restart();
        this.createSquares();
    }

    getSettings() {
        return [{prop: "squaresPerSide", type: "int", min: 2, max: 6, toCall: "restart"},
                {prop: "depth", type: "int", min: 2, max: 8, toCall: "restart"},
                {prop: "speed", icon: '<i class="fa-solid fa-gauge-high"></i>', type: "float", step: 0.25, min: 0.5, max: 8},
                {prop: "squareStyle", type: "select", values: this.squareStyles},
                {prop: "contain", name: "contained fit", type: "bool"},
                this.getSeedSettings()];
    }
}

module.exports = RecursiveSquares;
