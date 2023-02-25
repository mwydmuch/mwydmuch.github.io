'use strict';

/*
 * Base class for all animations based on grid of cells.
 */

const Animation = require("./animation");

class Grid extends Animation {
    constructor(canvas, colors, colorsAlt, 
                name = "",
                file = "",
                description = "",
                seed = "random") {
        super(canvas, colors, colorsAlt, file, description, seed);

        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = null;
        this.gridNext = null;
    }

    getIdx(x, y) {
        return x + y * this.gridWidth;
    }

    getIdxWrap(x, y) {
        return (x + this.gridWidth) % this.gridWidth + (y + this.gridHeight) % this.gridHeight * this.gridWidth;
    }

    getVal(x, y) {
        return this.grid[this.getIdx(x, y)];
    }

    getValWrap(x, y) {
        return this.grid[this.getIdxWrap(x, y)];
    }

    newCellState(x, y) {
        return 0;
    }

    resizeGrid(newGridWidth, newGridHeight){
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; y++) {
            for (let x = 0; x < newGridWidth; x++) {
                const cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(x, y)];
                else newGrid[cellCord] = this.newCellState(x, y);
            }
        }

        this.grid = newGrid;
        this.gridNext = [...this.grid];
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }

    restart(){
        this.gridWidth = 0;
        this.gridHeight = 0;
        super.restart();
    }
}

module.exports = Grid;