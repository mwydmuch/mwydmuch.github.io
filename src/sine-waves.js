/*
 * Grid of sine waves.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class SineWaves extends Animation {
    constructor(canvas, colors, colorsAlt,
                cellSize = 48,
                cellMargin = 12,
                rotateCells = false) {
        super(canvas, colors, colorsAlt, "grid of sine waves", "sine-waves.js");
        this.cellSize = cellSize;
        this.cellMargin = cellMargin;
        this.rotateCells = rotateCells;
        this.speed = 0.5;

        this.gridWidth = 0;
        this.gridHeight = 0;
        this.waves = [];
    }

    drawWave(x, y, freq, amp, phase) {
        this.ctx.beginPath();
        this.ctx.moveTo(x - this.cellSize / 2, y + Math.sin(phase) * amp);
        for (let i = 0; i < this.cellSize; ++i) {
            this.ctx.lineTo(x - this.cellSize / 2 + i, y + Math.sin(i / this.cellSize * 2 * Math.PI * freq + phase) * amp);
        }
        this.ctx.stroke();
    }

    draw() {
        this.clear();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];

        const wavesToDraw = this.gridCellsWidth * this.gridCellsHeight;

        if(!this.rotateCells) this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        for(let i = 0; i < wavesToDraw; ++i){
            const x = this.cellMargin + (i % this.gridCellsWidth) * this.cellTotalSize - this.gridWidth / 2 + this.cellSize / 2,
                  y = this.cellMargin + Math.floor(i / this.gridCellsWidth) * this.cellTotalSize - this.gridHeight / 2 + this.cellSize / 2,
                  w = this.waves[i];
            this.ctx.strokeStyle = w.color;
            if(this.rotateCells) {
                this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
                this.ctx.translate(x, y);
                this.ctx.rotate(w.rotation * 2 * Math.PI);
                this.drawWave(0, 0, w.freq, this.cellSize * w.noise * 0.5, w.noise * Math.PI + this.time * Math.PI);
                this.ctx.resetTransform();
            } else this.drawWave(x, y, w.freq, this.cellSize * w.noise * 0.5, w.noise * Math.PI + this.time * Math.PI);
        }
        if(!this.rotateCells) this.ctx.resetTransform();
    }

    resize() {
        this.cellTotalSize = this.cellMargin + this.cellSize;
        this.gridCellsWidth = Math.floor((this.ctx.canvas.width - this.cellMargin) / this.cellTotalSize);
        this.gridCellsHeight = Math.floor((this.ctx.canvas.height - this.cellMargin) / this.cellTotalSize);
        this.gridWidth = this.cellMargin + this.gridCellsWidth * this.cellTotalSize;
        this.gridHeight = this.cellMargin + this.gridCellsHeight * this.cellTotalSize;

        const newWaves = Math.max(0, this.gridWidth * this.gridHeight - this.waves.length);
        for(let i = 0; i < newWaves; ++i){
            this.waves.push({
                freq: Math.pow(2, Math.random() * 8) * Utils.randomChoice([-1, 1]),
                noise: Math.random(),
                rotation: Math.random(),
                color: Utils.randomChoice(this.colors)
            });
        }
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 16, max: 256, toCall: "resize"},
                {prop: "cellMargin", type: "int", min: 8, max: 32, toCall: "resize"},
                {prop: "rotateCells", type: "bool"},
                {prop: "speed", type: "float", step: 0.1, min: -4, max: 4}];
    }
}

module.exports = SineWaves;