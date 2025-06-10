'use strict';

const NAME = "day and night automata",
      FILE = "day-and-night-automata.js",
      DESC = `
Visualization of Day and Night auromata.
You can read abit about the automata on
[Wikipedia](https://en.wikipedia.org/wiki/Day_and_Night_(cellular_automaton))
or much more on [LifeWiki](https://conwaylife.com/wiki/OCA:Day_%26_Night).

You can pause the animation and set the cell states by clicking/touching the canvas.

My other cellular automata visualizations:
- [Conway's game of life](https://mwydmuch.pl/animations?animation=game-of-life)
- [Brain's brain](https://mwydmuch.pl/animations?animation=brains-brain-automata)
- [glitch automata](https://mwydmuch.pl/animations?animation=glitch-automata)
- [isometric game of life](https://mwydmuch.pl/animations?animation=game-of-life-isometric)
- [rock paper scissors](https://mwydmuch.pl/animations?animation=rock-paper-scissors-automata)
- [sand automata](https://mwydmuch.pl/animations?animation=sand-automata)

Coded by me (Marek Wydmuch) in 2023, with no external dependencies, using only canvas API.
`;

const GameOfLife = require("./game-of-life");

class DayAndNightAutomata extends GameOfLife {
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
                if (this.grid[cellIdx] <= 0 && [3, 6, 7, 8].includes(numAlive)) this.gridNext[cellIdx] = 1;
                else if (this.grid[cellIdx] >= 1 && [3, 4, 6, 7, 8].includes(numAlive)) this.gridNext[cellIdx] = 1;
                else this.gridNext[cellIdx] = this.grid[cellIdx] - 1;
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid]
    }
}

module.exports = DayAndNightAutomata;
