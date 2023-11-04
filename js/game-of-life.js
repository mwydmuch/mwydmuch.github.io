'use strict';

const NAME = "Conway's game of life",
      FILE = "game-of-life.js",
      DESC = `
Conway's game of life visualization. 
You can read about the game of life on
[Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life).
Game of life is one of the first programs I wrote in my life.

In this version, cells leave a trace for 
a few steps after they die to achieve a nice effect.
Especially, cells that died in the previous step keep the appearance 
of the life cell resulting in a stable image 
since flickering is not that good for a background image.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");
const Utils = require("./utils");

class GameOfLife extends Grid {
    constructor (canvas, colors, colorsAlt, bgColor,
                 cellSize = 12,
                 cellPadding = 1,
                 spawnProb = 0.5,
                 loopGrid = true,
                 cellStyle = "random",
                 deadCellsFadingSteps = 5) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        
        this.cellSize = cellSize;
        this.cellBasePadding = cellPadding;
        this.spawnProb = spawnProb;
        this.cellStyles = ["square", "circle"];
        this.cellStyle = this.assignIfRandom(cellStyle, Utils.randomChoice(this.cellStyles));
        this.deadCellsFadingSteps = deadCellsFadingSteps;
        this.loopGrid = loopGrid;
    }

    isAlive(x, y) {
        if(!this.loopGrid) {
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return 0;
            else return (this.getVal(x, y) >= 1) ? 1 : 0;
        }
        else return (this.getVal(x % this.gridWidth, y % this.gridHeight) >= 1) ? 1 : 0;
    }

    update(elapsed){
        super.update(elapsed);
        
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
                if (numAlive === 2 && this.grid[cellIdx] >= 1) this.gridNext[cellIdx] = this.grid[cellIdx] + 1;
                else if (numAlive === 3) this.gridNext[cellIdx] = Math.max(1, this.grid[cellIdx] + 1);
                else this.gridNext[cellIdx] = Math.min(0, this.grid[cellIdx] - 1);
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid]
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
        this.clear();

        this.ctx.translate(
            -(this.mapWidth * this.cellSize - this.ctx.canvas.width) / 2, 
            -(this.mapHeight * this.cellSize - this.ctx.canvas.height) / 2
        );

        if(this.cellStyle === "square") this.drawCell = this.drawSquareCell;
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

        this.ctx.resetTransform();
    }

    newCellState(x, y) {
        return (this.rand() < this.spawnProb) ? 1 : -99999;
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridWidth, newGridHeight);
    }

    getSettings() {
        return [{prop: "loopGrid", type: "bool"},
                {prop: "cellSize", type: "int", min: 4, max: 32, toCall: "restart"},
                {prop: "cellStyle", type: "select", values: this.cellStyles},
                {prop: "deadCellsFadingSteps", type: "int", min: 0, max: 8},
                {prop: "spawnProb", type: "float", step: 0.01, min: 0, max: 1, toCall: "restart"},
                this.getSeedSettings()];
    }

    mouseAction(cords) {
        // const x = Math.floor(cords.x / this.cellSize),
        //       y = Math.floor(cords.y / this.cellSize),
        //       cellCord = x + y * this.gridWidth;
        // this.grid[cellCord] = 1;
        // this.draw();
    }
}

module.exports = GameOfLife;
