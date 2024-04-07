'use strict';

const NAME = "3n + 1 (Collatz Conjecture) visualization",
      FILE = "3n+1.js",
      DESC = `
3n + 1 (Collatz Conjecture) visualization 
inspired by this Veritasium's [video](https://www.youtube.com/watch?v=094y1Z2wpJg).
You can also read about the conjecture on [Wikipedia](https://en.wikipedia.org/wiki/Collatz_conjecture).

Each tic Collatz sequence is generated for the next number.
Following the generated sequence from its end (1), 
for each number, the line is drawn from the point of the previous line's end.
The next line is drawn at the angle of the previous line, rotated by the angle 
that depends if the following number in the sequence is even or odd.

Coded with no external dependencies, using only canvas API.
`;


const Animation = require("./animation");
const Utils = require("./utils");

class ThreeNPlusOne extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                length = 30.0,
                evenAngle = 8.0,
                oddAngle = -20.0,
                drawNumbers = false,
                scale = 1,
                center = false,
                showStats = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.length = length;
        this.evenAngle = evenAngle;
        this.oddAngle = oddAngle;
        this.scale = scale;
        this.center = center;
        this.drawNumbers = drawNumbers;
        this.showStats = showStats;
        
        this.sequences = [];
        this.max = 0;
    }

    generateNextSequence(){
        let n = this.sequences.length + 1,
            sequence = [n];
        while (n !== 1) {
            if (n % 2) n = 3 * n + 1;
            else n /= 2;
            if(n > this.max) this.max = n;
            sequence.push(n);
            if(n < this.sequences.length) this.sequences[n - 1] = null;
        }
        this.sequences.push(sequence);
    }

    update(elapsed){
        for (let i = 0; i < this.speed; ++i) this.generateNextSequence();
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

        this.ctx.translate(this.ctx.canvas.width / 2,  this.ctx.canvas.height / (this.center ? 2 : 1));
        this.ctx.scale(this.scale, this.scale);

        while(this.frame < this.sequences.length){
            this.drawSequence(this.sequences[this.frame]);
            ++this.frame;
        }
        this.ctx.resetTransform();

        if(this.showStats){
            let statsLines = [
                `Current starting number: ${this.sequences.length}`,
                `Highest reached number: ${this.max}`
            ];
            this.resetFont();
            this.drawTextLines(statsLines, this.lineHeight, this.ctx.canvas.height - (statsLines.length + 1) * this.lineHeight);
        }
    }

    resize() {
        this.frame = 0;
        this.clear();
    }

    restart(){
        this.sequences = [];
        this.max = 0;
        super.restart();
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.resize();
    }

    getSettings() {
        return [{prop: "length", type: "float", min: 1, max: 100, step: 0.1, toCall: "resize"},
                {prop: "evenAngle", type: "float", min: -45, max: 45, step: 0.1, toCall: "resize"},
                {prop: "oddAngle", type: "float", min: -45, max: 45, step: 0.1, toCall: "resize"},
                {prop: "speed", type: "int", min: 1, max: 16},
                {prop: "drawNumbers", type: "bool", toCall: "resize"},
                {prop: "scale", type: "float", min: 0.05, max: 1.95, toCall: "resize"},
                {prop: "center", type: "bool", toCall: "resize"},
                {prop: "showStats", type: "bool"}];
    }
}

module.exports = ThreeNPlusOne;
