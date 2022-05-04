/*
 * Conway's game of life visualization.
 * Cells that "died" in the previous step keep their color to achieve a stable image
 * (flickering is not good for a background image).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");

class GameOfLife extends Animation {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 12,
                 cellPadding = 1,
                 spawnProb= 0.5,
                 cellShape = "square",
                 deadCellsFadingSteps = 5) {
        super(canvas, colors, colorsAlt, "Conway's game of life", "game-of-live.js");
        this.cellSize = cellSize;
        this.cellBasePadding = cellPadding;
        this.spawnProb = spawnProb;
        this.cellShape = cellShape;
        this.deadCellsFadingSteps = deadCellsFadingSteps;

        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = null;
        this.gridNextState = null;
    }

    getIdx(x, y) {
        return x + y * this.gridWidth;
    }

    getVal(x, y) {
        return this.grid[this.getIdx(x, y)];
    }

    isAlive(x, y) {
        // if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return 0;
        // else return (this.getVal(x, y) >= 1) ? 1 : 0;
        return (this.getVal(x % this.gridWidth, y % this.gridHeight) >= 1) ? 1 : 0;
    }

    update(elapsed){
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                const numAlive = this.isAlive(x - 1, y - 1)
                      + this.isAlive(x, y - 1)
                      + this.isAlive(x + 1, y - 1)
                      + this.isAlive(x - 1, y)
                      + this.isAlive(x + 1, y)
                      + this.isAlive(x - 1, y + 1)
                      + this.isAlive(x, y + 1)
                      + this.isAlive(x + 1, y + 1);
                const cellIdx = this.getIdx(x, y);
                if (numAlive == 2 && this.grid[cellIdx] >= 1) this.gridNextState[cellIdx] = this.grid[cellIdx] + 1;
                else if (numAlive == 3) this.gridNextState[cellIdx] = Math.max(1, this.grid[cellIdx] + 1);
                else this.gridNextState[cellIdx] = Math.min(0, this.grid[cellIdx] - 1);
            }
        }

        [this.grid, this.gridNextState] = [this.gridNextState, this.grid];
    }

    drawSquareCell(x, y, cellPadding){
        this.ctx.fillRect(x * this.cellSize + cellPadding, y * this.cellSize + cellPadding,
            this.cellSize - 2 * cellPadding, this.cellSize - 2 * cellPadding);
    }

    drawCircleCell(x, y, cellPadding){
        this.ctx.beginPath();
        this.ctx.arc(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - cellPadding, 0, 2 * Math.PI, false);
        this.ctx.fill();
    }

    draw() {
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if(this.cellShape === "square") this.drawCell = this.drawSquareCell;
        else this.drawCell = this.drawCircleCell;

        const maxPadding = this.cellSize / 2 - this.cellBasePadding,
              paddingPerStep = maxPadding / (this.deadCellsFadingSteps + 1);

        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                const cellVal = this.getVal(x, y);
                let cellPadding = this.cellBasePadding,
                    fillStyle = null,
                    valCond = -1;
                if(cellVal > 0) fillStyle = this.colors[0];
                else {
                    for (let i = 0; i < this.deadCellsFadingSteps; ++i) {
                        if (cellVal > valCond) {
                            fillStyle = this.colors[Math.min(i, this.colors.length - 1)];
                            cellPadding += i * paddingPerStep;
                            break;
                        }
                        valCond *= 2;
                    }
                }
                if(fillStyle) {
                    this.ctx.fillStyle = fillStyle;
                    this.drawCell(x, y, cellPadding);
                }
            }
        }
    }

    resizeGrid(newGridWidth, newGridHeight){
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; y++) {
            for (let x = 0; x < newGridWidth; x++) {
                let cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getIdx(x, y)];
                else newGrid[cellCord] = (Math.random() < this.spawnProb) ? 1 : -99999;
            }
        }

        this.grid = newGrid;
        this.gridNextState = [...this.grid];
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{
            prop: "cellSize",
            type: "int",
            min: 4,
            max: 32,
            toCall: "resize",
        }, {
            prop: "cellShape",
            type: "select",
            values: ["square", "circle"],
        }, {
            prop: "deadCellsFadingSteps",
            type: "int",
            min: 0,
            max: 8,
        }];
    }
}

module.exports = GameOfLife;
