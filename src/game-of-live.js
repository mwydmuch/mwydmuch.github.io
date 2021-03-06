'use strict';

const Animation = require("./animation");

class GameOfLife extends Animation {
    constructor (canvas, colors, cellSize = 10) {
        super(canvas, colors);
        this.cellSize = cellSize;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = null;
        this.gridNextState = null;
        this.resize();
    }

    getName(){
        return "Conway's Game of Life"
    }

    getCord(x, y) {
        return x + y * this.gridWidth;
    }

    isAlive(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return false;
        else return (this.grid[this.getCord(x, y)] == 1) ? 1 : 0;
    }

    update(elapsed){
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let numAlive = this.isAlive(x - 1, y - 1)
                    + this.isAlive(x, y - 1)
                    + this.isAlive(x + 1, y - 1)
                    + this.isAlive(x - 1, y)
                    + this.isAlive(x + 1, y)
                    + this.isAlive(x - 1, y + 1)
                    + this.isAlive(x, y + 1)
                    + this.isAlive(x + 1, y + 1);
                let cellCord = this.getCord(x, y);
                if (numAlive == 2 && this.grid[cellCord] == 1) this.gridNextState[cellCord] = this.grid[cellCord];
                else if (numAlive == 3) this.gridNextState[cellCord] = 1;
                else this.gridNextState[cellCord] = this.grid[cellCord] - 1;
            }
        }

        [this.grid, this.gridNextState] = [this.gridNextState, this.grid];
    }

    draw() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let cellVal = this.grid[this.getCord(x, y)];
                //let cellPadding = 1 - Math.min(0, cellVal);
                let cellPadding = 1
                let fillStyle = null;
                if(cellVal >= 0 ) fillStyle = this.colors[0];
                else if(cellVal >= -2){
                    fillStyle = this.colors[1];
                    cellPadding += 1
                }
                else if(cellVal >= -4){
                    fillStyle = this.colors[2];
                    cellPadding += 2
                }
                else if(cellVal >= -16){
                    fillStyle = this.colors[3];
                    cellPadding += 3
                }
                if(fillStyle) {
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.fillRect(x * this.cellSize + cellPadding,
                        y * this.cellSize + cellPadding,
                        this.cellSize - 2 * cellPadding,
                        this.cellSize - 2 * cellPadding);
                }
            }
        }
    }

    resize() {
        let newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize);
        let newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; y++) {
            for (let x = 0; x < newGridWidth; x++) {
                let cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getCord(x, y)];
                else newGrid[cellCord] = (Math.random() > 0.5) ? 1 : 0;
            }
        }

        this.grid = newGrid;
        this.gridNextState = [...this.grid];
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }
}

module.exports = GameOfLife;
