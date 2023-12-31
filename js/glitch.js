'use strict';

const NAME = "Glitch animation",
      FILE = "glitch.js",
      DESC = `
The animation is just cellular automata that apply to the cell 
a state of one of the neighbor cells based on a noise function.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");
const Utils = require("./utils");

class Glitch extends Grid {
    constructor(canvas, colors, colorsAlt, bgColor,
                cellSize = 7,
                initialPatern = "random",
                noiseScale = 0.0051) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.noiseScale = noiseScale;
        
        this.initialPaterns = ["1x1 checkerboard", "2x2 checkerboard", "4x4 checkerboard", "vertical lines", "horizontal lines"];
        this.initialPatern = this.assignIfRandom(initialPatern, Utils.randomChoice(this.initialPaterns));
    }

    update(elapsed){
        super.update(elapsed);

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const r = this.noise.simplex3(x * this.noiseScale, y * this.noiseScale, this.frame * this.noiseScale);
                const sw = Math.round(20 * r) % 5;
                const cellIdx = this.getIdx(x, y);
                switch (sw) {
                    case 0:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x - 1, y)]; // west
                        break
                    case 1:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x + 1, y)]; // east
                        break
                    case 2:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x, y - 1)]; // north
                        break
                    case 3:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x, y + 1)]; // south
                        break
                    case 4:
                        this.gridNext[cellIdx] = this.grid[cellIdx]; // self
                }
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid];
    }

    draw() {
        this.clear();
        this.ctx.fillStyle = this.colors[0];
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                if(this.grid[this.getIdx(x, y)] > 0) this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }

    newCellState(x, y) {
        if(this.initialPatern == "1x1 checkerboard") return (x + y) % 2 ? 1 : 0;
        else if(this.initialPatern == "2x2 checkerboard"){
            const x2 = Math.floor(x / 2),
                  y2 = Math.floor(y / 2);
            return (x2 + y2) % 2 ? 1 : 0;
        } else if(this.initialPatern == "4x4 checkerboard"){
            const x2 = Math.floor(x / 4),
                  y2 = Math.floor(y / 4);
            return (x2 + y2) % 2 ? 1 : 0;
        } else if(this.initialPatern == "vertical lines") return x % 4 ? 0 : 1;
        else if(this.initialPatern == "horizontal lines") return y % 4 ? 0 : 1;
        else return Math.round(Math.random());
        return 0;
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 12, toCall: "resize"},
                {prop: "initialPatern", type: "select", values: this.initialPaterns, toCall: "restart"},
                {prop: "noiseScale", type: "float", step: 0.0001, min: 0.001, max: 0.05},
                this.getSeedSettings()];
    }
}

module.exports = Glitch;
