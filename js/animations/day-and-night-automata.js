'use strict';

const NAME = "Day and Night automata",
      FILE = "day-and-night-automata.js",
      DESC = `
Visualization of Day and Night auromata.
You can read about the automata on
[Wikipedia](https://en.wikipedia.org/wiki/Day_and_Night_(cellular_automaton)).

Coded with no external dependencies, using only canvas API.
`;

const GameOfLife = require("./game-of-life");

class DayAndNightAutomata extends GameOfLife {
    constructor (canvas, colors, colorsAlt, bgColor,
                 cellSize = 12,
                 cellBasePadding = 1,
                 spawnProb = 0.4,
                 cellStyle = "random") {
        super(canvas, colors, colorsAlt, bgColor, cellSize, cellBasePadding, spawnProb, true, cellStyle, 0);

        this.name = NAME;
        this.file = FILE;
        this.description = DESC;
    }

    update(elapsed){
        super.update(elapsed);
        
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                const numAlive = this.numAliveInMooreNeighborhood(x, y),
                      cellIdx = this.getIdx(x, y);                    
                if (this.grid[cellIdx] <= 0 && numAlive in [3, 6, 7, 8]) this.gridNext[cellIdx] = 1;
                else if (this.grid[cellIdx] >= 0 && numAlive in [3, 4, 6, 7, 8]) this.gridNext[cellIdx] = 1;
                else this.gridNext[cellIdx] = 0;
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid]
    }

    getSettings() {
        return [{prop: "changeGrid", type: "text", value: "<click/touch>"},
                {prop: "cellSize", type: "int", min: 4, max: 32, toCall: "restart"},
                {prop: "cellStyle", type: "select", values: this.cellStyles},
                {prop: "spawnProb", type: "float", step: 0.01, min: 0, max: 1, toCall: "restart"},
                this.getSeedSettings()];
    }
}

module.exports = DayAndNightAutomata;
