'use strict';

const Animation = require("./animation");

// Based on: https://observablehq.com/@rreusser/instanced-webgl-circles
class SpinningShapes extends Animation {
    constructor (canvas, colors, colorsAlt, shapes = 500) {
        super(canvas, colors, colorsAlt);
        this.shapes = shapes;
        this.time = 0;
        this.scale = 0;
        this.centerX = 0;
        this.centerY = 0;

        this.distBase = 0.6;
        this.distVar = 0.2;
        this.sizeBase = 0.2;
        this.sizeVar = 0.12;

        this.resize();
    }

    getName(){
        return "circles moving in a circle"
    }

    update(elapsed){
        this.time += elapsed / 1000;
    }

    getCenterForTheta(theta, time, scale) {
        let distance = (this.distBase + this.distVar * Math.cos(theta * 6 + Math.cos(theta * 8 + time / 2))) * scale;
        return {x: Math.cos(theta) * distance, y: Math.sin(theta) * distance}
    }

    getSizeForTheta(theta, time, scale) {
        return (this.sizeBase + this.sizeVar * Math.cos(theta * 9 - time)) * scale;
    }

    getColorForTheta(theta, time) {
        return this.colors[Math.floor((Math.cos(theta * 9 - time) + 1) / 2 * this.colors.length)];
    }

    draw() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (let i = 0; i < this.shapes; ++i) {
            let shapeTheta = i / this.shapes * 2 * Math.PI;
            let shapeCenter = this.getCenterForTheta(shapeTheta, this.time, this.scale);
            let shapeSize = this.getSizeForTheta(shapeTheta, this.time, this.scale);
            this.ctx.strokeStyle = this.getColorForTheta(shapeTheta, this.time);
            this.ctx.lineWidth = 1;

            // TODO: draw other types of polygons instead of circles
            this.ctx.beginPath();
            this.ctx.arc(shapeCenter.x + this.centerX, shapeCenter.y + this.centerY, shapeSize, 0, 2 * Math.PI, false);
            this.ctx.stroke();
        }
    }

    resize() {
        this.centerX = this.ctx.canvas.width / 2;
        this.centerY = this.ctx.canvas.height / 2;
        this.scale = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) / 3;
    }
}

module.exports = SpinningShapes
