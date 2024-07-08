'use strict';

const NAME = "Day and Night automata",
      FILE = "day-and-night-automata.js",
      DESC = `
Visualization of Day and Night auromata.
You can read about the automata on
[Wikipedia](https://en.wikipedia.org/wiki/Day_and_Night_(cellular_automaton)).
https://conwaylife.com/wiki/OCA:Day_%26_Night

Coded with no external dependencies, using only canvas API.
`;

const GameOfLife = require("./game-of-life");

class DayAndNightAutomata extends GameOfLife {
    constructor (canvas, colors, colorsAlt, bgColor,
                 cellSize = 12,
                 cellPadding = 1,
                 spawnProb = 0.4,
                 loopGrid = true,
                 cellStyle = "random",
                 deadCellsFadingSteps = 5) {
        super(canvas, colors, colorsAlt, bgColor, cellSize, cellPadding, spawnProb, loopGrid, cellStyle, deadCellsFadingSteps);

        this.name = NAME;
        this.file = FILE;
        this.description = DESC;
    }

    update(elapsed){
        ++this.frame;
        
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                const numAlive = this.numAliveInMooreNeighborhood(x, y),
                      cellIdx = this.getIdx(x, y);                    
                if (this.grid[cellIdx] <= 0 && [3, 6, 7, 8].includes(numAlive)) this.gridNext[cellIdx] = 1;
                else if (this.grid[cellIdx] >= 1 && [3, 4, 6, 7, 8].includes(numAlive)) this.gridNext[cellIdx] = 1;
                else this.gridNext[cellIdx] = this.grid[cellIdx] - 1;
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid]
    }
}

module.exports = DayAndNightAutomata;
