'use strict';

// TODO: Improve this description
const NAME = "Rock-paper-scissors automata",
      FILE = "rock-paper-scissors-automata.js",
      DESC = `
Rock-paper-scissors automata.

This cellular automata adapts the rules of the rock-paper-scissors game 
(one type beats one state but loses to another).
If the cell has more than a defined number of neighbors with the state it losses to, 
it changes its state to that state.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");
const Utils = require("./utils");

class RockPaperScissorsAutomata extends Grid {
    constructor(canvas, colors, colorsAlt,
                cellSize = 6,
                states = 3,
                minimumLosses = 3) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.states = states;
        this.minimumLosses = minimumLosses;
    }

    update(elapsed){
        super.update(elapsed);

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const cellIdx = this.getIdx(x, y),
                      cellVal = this.grid[cellIdx],
                      nextVal = (cellVal + 1) % this.states;
                let neighbours = Array(this.states).fill(0);
                ++neighbours[this.getValWrap(x - 1, y - 1)];
                ++neighbours[this.getValWrap(x, y - 1)];
                ++neighbours[this.getValWrap(x + 1, y - 1)];
                ++neighbours[this.getValWrap(x - 1, y)];
                ++neighbours[this.getValWrap(x + 1, y)];
                ++neighbours[this.getValWrap(x - 1, y + 1)];
                ++neighbours[this.getValWrap(x, y + 1)];
                ++neighbours[this.getValWrap(x + 1, y + 1)];

                if(neighbours[nextVal] >= this.minimumLosses) this.gridNext[cellIdx] = nextVal;
                else this.gridNext[cellIdx] = cellVal;
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid];
    }

    draw() {
        this.clear();
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                this.ctx.fillStyle = this.colors[this.getVal(x, y)];
                this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }

    newCellState(x, y) {
        return Utils.randomInt(0, this.states, this.rand);
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 12, toCall: "resize"},
                {prop: "states", type: "int", min: 2, max: 6, toCall: "restart"},
                {prop: "minimumLosses", type: "int", min: 0, max: 8},
                this.getSeedSettings()];
    }
}

module.exports = RockPaperScissorsAutomata;
