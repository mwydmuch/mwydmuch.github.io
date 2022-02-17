/*
 * 3n + 1 (Collatz Conjecture) visualization.
 * Inspired by Veritasium video: https://www.youtube.com/watch?v=094y1Z2wpJg
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");

class ThreeNPlusOne extends Animation {
    constructor (canvas, colors, colorsAlt,
                 length = 30,
                 evenAngle = 8,
                 oddAngle = -20
    ) {
        super(canvas, colors, colorsAlt, "3n + 1 (Collatz Conjecture) visualization", "3n+1.js");
        this.length = length;
        this.evenAngle = evenAngle * Math.PI / 180;
        this.oddAngle = oddAngle * Math.PI / 180;
        this.seqences = []
        this.drawNumbers = (Math.random() > 0.5);
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
        let x = this.ctx.canvas.width / 2,
            y = this.ctx.canvas.height,
            angle = 270 * Math.PI / 180;
        const color = this.colors[this.frame % this.colors.length];

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = color;

        for(let i = sequence.length - 2; i >= 0; --i){
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);

            if(sequence[i] % 2) angle += this.oddAngle;
            else angle += this.evenAngle;

            if(this.drawNumbers){
                const sin = Math.cos(angle),
                      cos = Math.sin(angle);
                x += this.length / 2 * sin;
                y += this.length / 2 * cos;
                this.ctx.fillText(sequence[i], x + 10, y);
                x += this.length / 2 * sin;
                y += this.length / 2 * cos;
            } else {
                x += this.length * Math.cos(angle);
                y += this.length * Math.sin(angle);
            }
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
        this.frame = 0;
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

module.exports = ThreeNPlusOne;
