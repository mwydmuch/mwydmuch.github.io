'use strict';

/*
 * Base class for all animations based on grid of cells. E.g. cellular automata.
 */

const Animation = require("./animation");

class GridAnimation extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor, 
                name = "",
                file = "",
                description = "",
                seed = "random") {
        super(canvas, colors, colorsAlt, bgColor, name, file, description, seed);

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

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    resizeGrid(newGridWidth, newGridHeight){
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; ++y) {
            for (let x = 0; x < newGridWidth; ++x) {
                const cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(x, y)];
                else newGrid[cellCord] = this.newCellState(x, y);
            }
        }

        // Explicitly delete old arrays to free memory
        delete this.grid;
        delete this.gridNext;

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

module.exports = GridAnimation;