'use strict';

const NAME = "Brian's brain automata",
      FILE = "brians-brain-automata.js",
      DESC = `
Visualization of Brain's brain auromata.
You can read a bit about the automata on
[Wikipedia](https://en.wikipedia.org/wiki/Brian%27s_Brain)
or much more on [LifeWiki](https://conwaylife.com/wiki/OCA:Brian%27s_Brain).

You can pause the animation and set the cell states by clicking/touching the canvas.

My other cellular automata visualizations:
- [Conway's game of life](https://mwydmuch.pl/animations?animation=game-of-life)
- [day and night](https://mwydmuch.pl/animations?animation=day-and-night-automata)
- [isometric game of life](https://mwydmuch.pl/animations?animation=game-of-life-isometric)
- [rock paper scissors](https://mwydmuch.pl/animations?animation=rock-paper-scissors-automata)
- [sand automata](https://mwydmuch.pl/animations?animation=sand-automata)

Coded by me (Marek Wydmuch) in 2023, with no external dependencies, using only canvas API.
`;

const GameOfLife = require("./game-of-life");

class BriansBrainAutomata extends GameOfLife {
    constructor (canvas, colors, colorsAlt, bgColor,
                 cellSize = 12,
                 cellPadding = 1,
                 spawnProb = 0.5,
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
