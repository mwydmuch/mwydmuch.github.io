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
        let x = this.ctx.canvas.width / 2;
        let y = this.ctx.canvas.height;
        let angle = 270 * Math.PI / 180;

        this.ctx.strokeStyle = this.colors[this.frame % this.colors.length];
        this.ctx.lineWidth = 2;

        for(let i = sequence.length - 2; i >= 0; --i){
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);

            if(sequence[i] % 2) angle += this.oddAngle;
            else angle += this.evenAngle;

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
        this.frame = 0;
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

module.exports = ThreeNPlusOne;
