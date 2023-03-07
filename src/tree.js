'use strict';


// Work in progress.
// Binary tree animation.

const Animation = require("./animation");
const Utils = require("./utils");

class Tree extends Animation {
    constructor (canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "tree", "tree.js");
        this.frame = 0;
    }

    getName(){
        return "binary tree";
    }

    update(timeElapsed){
        this.frame++;
    }

    getFPS() {
        return 1;
    }

    branch(ctx, x, y, a, branchLength, branchAngle, levels){
        Utils.pathCircle(ctx, x, y, 5);
        if(levels > 0){
            const left = Utils.rotateVec2d({x: 0, y: branchLength}, a + branchAngle);
            Utils.pathLine(ctx, x, y, x + left.x, y + left.y);

            const right = Utils.rotateVec2d({x: 0, y: branchLength}, a - branchAngle);
            Utils.pathLine(ctx, x, y, x + right.x, y + right.y);

            const nextLength = branchLength * 4/7;
            const nextAngle = branchAngle * 7/9;
            this.branch(ctx, x + left.x, y + left.y, 0, nextLength, nextAngle, levels - 1);
            this.branch(ctx, x + right.x, y + right.y, 0, nextLength, nextAngle, levels - 1);

            //const nextLength = branchLength * 2/3;
            //this.branch(ctx, x + left.x, y + left.y, a + branchAngle, nextLength, branchAngle);
            //this.branch(ctx, x + right.x, y + right.y, a - branchAngle, nextLength, branchAngle);
        }
    }

    genTree(){
        this.tree.push({
            parent: 0,
            left: 0,
            right: 0,
            pred: 0,
            visited: false,
        });
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors[0];
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        this.branch(this.ctx, 0, 0, 0, 300, 80 * Math.PI / 180, 6);
        this.ctx.stroke();
    }

    resize() {

    }
}

module.exports = Tree;
