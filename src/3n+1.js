'use strict';

/*
 * 3n + 1 (Collatz Conjecture) visualization.
 * Inspired by Veritasium video: https://www.youtube.com/watch?v=094y1Z2wpJg
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class ThreeNPlusOne extends Animation {
    constructor(canvas, colors, colorsAlt,
                length = 30,
                evenAngle = 8,
                oddAngle = -20,
                drawNumbers = true,
                scale = 1) {
        super(canvas, colors, colorsAlt, "3n + 1 (Collatz Conjecture) visualization", "3n+1.js");
        this.length = length;
        this.evenAngle = evenAngle;
        this.oddAngle = oddAngle;
        this.scale = scale;
        this.drawNumbers = drawNumbers;

        this.seqences = [];
    }

    update(elapsed){
        let n = this.seqences.length + 1;
        let sequence = [n];
        while (n !== 1) {
            if (n % 2) n = 3 * n + 1;
            else n /= 2;
            sequence.push(n);
            if(n < this.seqences.length) this.seqences[n - 1] = null;
        }
        this.seqences.push(sequence);
    }

    drawSequence(sequence) {
        if(sequence === null) return;

        let x = 0, y = 0,
            angle = 270 * Math.PI / 180;
        const color = this.colors[this.frame % this.colors.length];

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = color;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        for(let i = sequence.length - 2; i >= 0; --i){
            const val = sequence[i];
            if(val % 2) angle += this.oddAngleRad;
            else angle += this.evenAngleRad;

            if(this.drawNumbers){
                const sin = Math.cos(angle),
                      cos = Math.sin(angle);
                x += this.length / 2 * sin;
                y += this.length / 2 * cos;
                this.ctx.fillText(val, x + 10, y);
                x += this.length / 2 * sin;
                y += this.length / 2 * cos;
            } else {
                x += this.length * Math.cos(angle);
                y += this.length * Math.sin(angle);
            }
            this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }

    draw() {
        this.evenAngleRad = this.evenAngle * Math.PI / 180;
        this.oddAngleRad = this.oddAngle * Math.PI / 180;

        this.ctx.translate(this.ctx.canvas.width / 2,  this.ctx.canvas.height);
        this.ctx.scale(this.scale, this.scale);

        while(this.frame < this.seqences.length){
            this.drawSequence(this.seqences[this.frame]);
            ++this.frame;
        }
        this.ctx.resetTransform();
    }

    resize() {
        this.frame = 0;
        this.clear();
    }

    getSettings() {
        return [{prop: "length", type: "int", min: 1, max: 100, toCall: "resize"},
                {prop: "evenAngle", type: "int", min: -45, max: 45, toCall: "resize"},
                {prop: "oddAngle", type: "int", min: -45, max: 45, toCall: "resize"},
                {prop: "drawNumbers", type: "bool", toCall: "resize"},
                {prop: "scale", type: "float", min: 0.05, max: 1.95, toCall: "resize"}];
    }
}

module.exports = ThreeNPlusOne;
