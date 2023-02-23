'use strict';

const NAME = "Glitch animation",
      FILE = "glitch.js",
      DESC = `
Glitch animation inspired by: https://openprocessing.org/sketch/1219550
`;

const Animation = require("./animation");

class Glitch extends Animation {
    constructor(canvas, colors, colorsAlt,
                cellSize = 6,
                noiseScale = 0.0051) {
        super(canvas, colors, colorsAlt, "Glitch", "glitch.js");
        this.cellSize = cellSize;
        this.noiseScale = noiseScale;

        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = null;
    }

    wrapGetIdx(x, y) {
        return (x + this.gridWidth) % this.gridWidth + (y + this.gridHeight) % this.gridHeight * this.gridWidth;
    }

    getIdx(x, y) {
        return x + y * this.gridWidth;
    }

    getVal(x, y) {
        return this.grid[this.getIdx(x, y)];
    }

    draw() {
        this.clear();

        let next = [...this.grid];
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const r = this.noise.simplex3(x * this.noiseScale, y * this.noiseScale, this.frame * this.noiseScale);
                const sw = Math.round(20 * r) % 5;
                const cellIdx = this.getIdx(x, y);
                switch (sw) {
                    case 0:
                        next[cellIdx] = this.grid[this.wrapGetIdx(x - 1, y)]; // west
                        break
                    case 1:
                        next[cellIdx] = this.grid[this.wrapGetIdx(x + 1, y)]; // east
                        break
                    case 2:
                        next[cellIdx] = this.grid[this.wrapGetIdx(x, y - 1)]; // north
                        break
                    case 3:
                        next[cellIdx] = this.grid[this.wrapGetIdx(x, y + 1)]; // south
                        break
                    case 4:
                        next[cellIdx] = this.grid[cellIdx]; // self
                }
            }
        }

        this.grid = next;
        this.ctx.fillStyle = this.colors[0];
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                if(this.grid[this.getIdx(x, y)] > 0) this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }

    resizeGrid(newGridWidth, newGridHeight){
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; y++) {
            for (let x = 0; x < newGridWidth; x++) {
                const cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(x, y)];
                else newGrid[cellCord] = (x + y) % 2 ? 1 : 0;
            }
        }

        this.grid = newGrid;
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    restart(){
        this.gridWidth = 0;
        this.gridHeight = 0;
        super.restart();
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 12, toCall: "resize"},
                {prop: "noiseScale", type: "float", step: 0.0001, min: 0.001, max: 0.05}];
    }
}

module.exports = Glitch;
