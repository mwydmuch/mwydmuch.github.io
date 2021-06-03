'use strict';

// Based on: https://observablehq.com/@rreusser/instanced-webgl-circles
class SpinningShapes {
    constructor (canvas, colors, shapes = 500) {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.shapes = shapes;
        this.colors = colors;
        this.time = 0;
        this.scale = 0;
        this.centerX = 0;
        this.centerY = 0;
        this.resize();

        this.dist_base = 0.6;
        this.dist_var = 0.2;
        this.size_base = 0.2;
        this.size_var = 0.12;
    }

    getFPS(){
        return 30;
    }

    getName(){
        return "circles moving in circle"
    }

    update(elapsed){
        this.time += elapsed / 1000;
    }

    getCenterForTheta(theta, time, scale) {
        let distance = (this.dist_base + this.dist_var * Math.cos(theta * 6 + Math.cos(theta * 8 + time / 2))) * scale;
        return {x: Math.cos(theta) * distance, y: Math.sin(theta) * distance}
    }

    getSizeForTheta(theta, time, scale) {
        return (this.size_base + this.size_var * Math.cos(theta * 9 - time)) * scale;
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
