'use strict';

const NAME = "Rock-paper-scissors automata",
      FILE = "rock-paper-scissors-automata.js",
      DESC = `
Sand automata.

This cellular automata is a simple model of falling sand.
I generates random tetris blocks and lets them fall to demonstrate
the properties of automata.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");
const Utils = require("./utils");

class SandAutomata extends Grid {
    constructor(canvas, colors, colorsAlt,
                cellSize = 4,
                blockSize = 4) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.blockSize = blockSize;
        
        // All tetris blocks with all rotations
        this.blocksTemplates = [
            ["XXXX"],
            ["X",
             "X",
             "X",
             "X"],

            ["XX ",
             " XX"],
            ["X ",
             "XX",
             " X"],

            [" XX",
             "XX "],
            [" X",
             "XX",
             "X "],

            ["XX",
             "XX"],
            ["XX",
             "XX"],
            
            ["XXX",
             " X "],
            [" X ",
             "XXX"],
            ["X ",
             "XX",
             "X "],
            [" X",
             "XX",
             " X"],
            
            ["XXX",
             "  X"],
            ["X  ",
             "XXX"],
            ["XX",
             "X ",
             "X "],
            [" X",
             " X",
             "XX"],
            
            ["XXX",
             "X  "],
            ["  X",
             "XXX"],
            ["X ",
             "X ",
             "XX"],
            ["XX",
             " X",
             " X"],
        ]

        // Generate real blocks
        this.blocks = [];
        for(let tempalte of this.blocksTemplates){
            let newBlock = [];
            for(let i = 0; i < tempalte.length * this.blockSize; ++i) newBlock.push([]);
            for(let i = 0; i < tempalte.length; ++i){
                for(let j = 0; j < tempalte[i].length; ++j){
                    const val = 1 ? tempalte[i][j] == "X" : 0;
                    for(let k = 0; k < this.blockSize; ++k){
                        for(let l = 0; l < this.blockSize; ++l){
                            newBlock[i * this.blockSize + k].push(val);
                        }
                    }
                }
            }

            this.blocks.push(newBlock);
        }
        
    }

    update(elapsed){
        super.update(elapsed);
        
        // Spawn some and very update
        if(this.frame % 30 == 0){
            const block = Utils.randomChoice(this.blocks, this.rand),
                  blockPos = Utils.randomInt(0, this.gridWidth - block[0].length, this.rand),
                  blockVal = Utils.randomInt(0, this.colors.length, this.rand) + 1;

            for(let x = 0; x < block[0].length; ++x){
                for(let y = 0; y < block.length; ++y){
                    const cellIdx = this.getIdx(blockPos + x, y),
                          cellVal = block[y][x];
                    this.grid[cellIdx] = cellVal * blockVal - 1;
                }
            }
        }

        // Update grid
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = this.gridHeight - 2; y >= 0; --y) {
                const cellIdx = this.getIdx(x, y),
                      cellVal = this.grid[cellIdx];
                
                if(cellVal < 0) continue;

                const belowIdx = this.getIdx(x, y + 1),
                      belowVal = this.grid[belowIdx];
                if(belowVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[belowIdx] = cellVal;
                    continue;
                }

                const leftIdx = this.getIdxWrap(x - 1, y + 1),
                      leftVal = this.grid[leftIdx];
                if(leftVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[leftIdx] = cellVal;
                    continue;
                }

                const rightIdx = this.getIdxWrap(x + 1, y + 1),
                      rightVal = this.grid[rightIdx];
                if(rightVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[rightIdx] = cellVal;
                    continue;
                }
            }
        }
    }

    draw() {
        this.clear(); // Clear background to the color of the first state

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 4 * this.blockSize; y < this.gridHeight; ++y) {
                const val = this.getVal(x, y),
                      drawY = y - 4 * this.blockSize;
                if(val >= 0){ // Do not draw if the state is the first state (small optimization)
                    this.ctx.fillStyle = this.colors[val];
                    this.ctx.fillRect(x * this.cellSize, drawY * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize) + 4 * this.blockSize;
        
        let newGrid = new Array(newGridWidth * newGridHeight);
        newGrid.fill(-1);

        const gridMinHeight = Math.min(this.gridHeight, newGridHeight),
              gridMinWidth = Math.min(this.gridWidth, newGridWidth);
        for (let y = 0; y < gridMinHeight; ++y) {
            for (let x = 0; x < gridMinWidth; ++x) {
                const newCellCord = x + y * newGridWidth;
                newGrid[newCellCord] = this.grid[this.getIdx(x, y)];
            }
        }

        // Explicitly delete old arrays to free memory
        delete this.grid;

        this.grid = newGrid;
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 2, max: 12, toCall: "resize"},
                this.getSeedSettings()];
    }
}

module.exports = SandAutomata;
