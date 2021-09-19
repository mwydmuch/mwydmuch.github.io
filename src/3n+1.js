'use strict';

const Animation = require("./animation");

class ThreeNPlusOne extends Animation {
    constructor (canvas, colors, colorsAlt, length = 30, evenAngel = 8, oddAngel = -20) {
        super(canvas, colors, colorsAlt);
        this.length = length;
        this.evenAngel = evenAngel * Math.PI / 180;
        this.oddAngel = oddAngel * Math.PI / 180;
        this.seqences = []
        this.frame = 0;
        this.startX;
        this.startY;
        this.resize();
    }

    getName(){
        return "3n + 1 visualization"
    }

    update(elapsed){
        let n = this.seqences.length + 1;
        let sequence = [n];
        while(n != 1){
            if(n % 2) n = 3 * n + 1;
            else n /= 2;
            sequence.push(n);
        }
        this.seqences.push(sequence);
    }

    drawSequence(sequence) {
        let x = this.startX;
        let y = this.startY;
        let angle = 270 * Math.PI / 180;

        this.ctx.strokeStyle = this.colors[this.frame % this.colors.length];
        this.ctx.lineWidth = 2;

        for(let i = sequence.length - 2; i >= 0; --i){
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);

            if(sequence[i] % 2) angle += this.oddAngel;
            else angle += this.evenAngel;

            x += this.length * Math.cos(angle);
            y += this.length * Math.sin(angle);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }

    draw() {
        while(this.frame < this.seqences.length){
            this.drawSequence(this.seqences[this.frame]);
            ++this.frame;
        }
    }

    resize() {
        this.startX = this.ctx.canvas.width / 2;
        this.startY = this.ctx.canvas.height;

        this.frame = 0;
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

module.exports = ThreeNPlusOne;
