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
        this.centerResize = false;
        this.resetOnResize = false;
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

    newCellState(x, y, newGridWidth, newGridHeight) {
        return 0;
    }

    resize() {
        console.log(`Resized grid animation to ${this.canvas.width}x${this.canvas.height} px`);
        const newGridWidth = Math.ceil(this.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight, this.resetOnResize, this.centerResize);
    }

    resizeGrid(newGridWidth, newGridHeight, reset = false, center = false) {
        console.log(`Resizing grid from ${this.gridWidth}x${this.gridHeight} to ${newGridWidth}x${newGridHeight}, reset=${reset}, center=${center}...`);
        
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; ++y) {
            for (let x = 0; x < newGridWidth; ++x) {
                const cellCord = x + y * newGridWidth;
                if(reset) newGrid[cellCord] = this.newCellState(x, y, newGridWidth, newGridHeight);
                else if (center) {
                    // Center old grid in new grid
                    const oldX = x - Math.floor((newGridWidth - this.gridWidth) / 2),
                          oldY = y - Math.floor((newGridHeight - this.gridHeight) / 2);
                    if(oldX >= 0 && oldX < this.gridWidth && oldY >= 0 && oldY < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(oldX, oldY)];
                    else newGrid[cellCord] = this.newCellState(x, y, newGridWidth, newGridHeight);
                }
                else {
                    // Copy as much as possible from old grid to new grid (top-left aligned)
                    if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(x, y)];
                    else newGrid[cellCord] = this.newCellState(x, y, newGridWidth, newGridHeight);
                }
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