'use strict';

const NAME = "rock-paper-scissors automata",
      FILE = "rock-paper-scissors-automata.js",
      TAGS = ["framerate-dependent", "2d", "cellular automata", "rock-paper-scissors"],
      DESC = `
Rock-paper-scissors automata.

This cellular automata adapts the rules of the rock-paper-scissors game 
(one type beats one state but loses to another).
If the cell has more than a defined number of neighbors with the state it losses to, 
it changes its state to that state.

My other cellular automata visualizations:
- [Conway's game of life](https://mwydmuch.pl/animations?animation=game-of-life)
- [Brain's brain](https://mwydmuch.pl/animations?animation=brains-brain-automata)
- [day and night](https://mwydmuch.pl/animations?animation=day-and-night-automata)
- [isometric game of life](https://mwydmuch.pl/animations?animation=game-of-life-isometric)
- [sand automata](https://mwydmuch.pl/animations?animation=sand-automata)

Coded by me (Marek Wydmuch) in 2023, with no external dependencies, using only canvas API.
`;

const GridAnimation = require("../grid-animation");
const Utils = require("../utils");

class RockPaperScissorsAutomata extends GridAnimation {
    constructor(canvas, colors, colorsAlt, bgColor,
                cellSize = 9,
                numStates = 3,
                minimumLosses = 3) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.numStates = numStates;
        this.minimumLosses = minimumLosses;
    }

    update(elapsed){
        super.update(elapsed);

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const cellIdx = this.getIdx(x, y),
                      cellVal = this.grid[cellIdx],
                      nextVal = (cellVal + 1) % this.numStates;
                let neighbours = Array(this.numStates).fill(0);
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
        Utils.clear(this.ctx, this.colors[0]); // Clear background to the color of the first state

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const val = this.getVal(x, y);
                if(val){ // Do not draw if the state is the first state (small optimization)
                    this.ctx.fillStyle = this.colors[val];
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }

    newCellState(x, y) {
        return Utils.randomInt(0, this.numStates, this.rand);
    }

    resize() {
        const newGridWidth = Math.ceil(this.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 12, toCall: "resize"},
                {prop: "numStates", name: "number of states", type: "int", min: 2, max: 6, toCall: "restart"},
                {prop: "minimumLosses", name: "minimum number of losses", type: "int", min: 0, max: 8},
                this.getSeedSettings()];
    }
}

module.exports = RockPaperScissorsAutomata;
