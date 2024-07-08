'use strict';

const NAME = "Brian's brain automata",
      FILE = "brians-brain-automata.js",
      DESC = `
Visualization of Brain's brain auromata.
You can read about the automata on
[Wikipedia](https://en.wikipedia.org/wiki/Brian%27s_Brain).

You can pause the animation and use your mouse/touch to set the cell states.

Other cellular automata visualizations:
- [Conway's game of life](https://mwydmuch.pl/animations?name=game-of-life)
- [Day and Night automata](https://mwydmuch.pl/animations?name=day-and-night-automata)
- [Isometric game of life](https://mwydmuch.pl/animations?name=game-of-life-isometric)

Coded with no external dependencies, using only canvas API.
`;

const GameOfLife = require("./game-of-life");

class BriansBrainAutomata extends GameOfLife {
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
                if (numAlive === 2 && this.grid[cellIdx] < 0) this.gridNext[cellIdx] = 1;
                else this.gridNext[cellIdx] = this.grid[cellIdx] - 1;
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid]
    }
}

module.exports = BriansBrainAutomata;
