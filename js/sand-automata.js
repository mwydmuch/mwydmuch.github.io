'use strict';

const NAME = "sand automata",
      FILE = "sand-automata.js",
      DESC = `
The visualization of a simple sand automata, that is a simple model of falling sand.

There are many variations of this automata.
This one is updated in place, from the bottom to the top.
The cell can "fall" down to the cell below it if the cell below is empty. 
If not, it can move to the below left or right cell if one of those cells is empty.
To reduce the bias of falling to the left or right, 
the cells in each row are updated in random order.

It generates random Tetris blocks and lets them fall to demonstrate
the properties of automata.

Coded with no external dependencies, using only canvas API.
`;

const Grid = require("./grid");
const Utils = require("./utils");

class SandAutomata extends Grid {
    constructor(canvas, colors, colorsAlt, bgColor,
                cellSize = 5,
                spawnTetrisBlocks = true,
                tetrisBlocksSize = 5) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.spawnTetrisBlocks = spawnTetrisBlocks;
        this.tetrisBlocksSize = tetrisBlocksSize;
        this.maxBlockSize = 16;

        this.updateOrder = null;
        this.toRedraw = [];
        this.redrawAll = false;

        this.mouseDown = false;
        this.mouseCellCord = 0;
        this.mouseValue = 0;
        
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

        this.generateBlocks();
    }

    generateBlocks(){
        // Generate real blocks
        this.blocks = [];
        for(let tempalte of this.blocksTemplates){
            let newBlock = [];
            for(let i = 0; i < tempalte.length * this.tetrisBlocksSize; ++i) newBlock.push([]);
            for(let i = 0; i < tempalte.length; ++i){
                for(let j = 0; j < tempalte[i].length; ++j){
                    const val = 1 ? tempalte[i][j] == "X" : 0;
                    for(let k = 0; k < this.tetrisBlocksSize; ++k){
                        for(let l = 0; l < this.tetrisBlocksSize; ++l){
                            newBlock[i * this.tetrisBlocksSize + k].push(val);
                        }
                    }
                }
            }

            this.blocks.push(newBlock);
        }
    }

    update(elapsed){
        super.update(elapsed);
        
        // Spawn new block every 30 frames
        if(this.frame % 30 == 0 && this.spawnTetrisBlocks){
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

        // Spawn mouse 
        if(this.mouseDown){
            this.grid[this.mouseCellCord] = this.mouseValue;
            this.toRedraw[this.mouseCellCord] = 1;
        }
    
        // Update grid
        for (let y = this.gridHeight - 2; y >= 0; --y) {
            Utils.randomShuffle(this.updateOrder, this.rand);
            for (let i = 0; i < this.gridWidth; ++i) {
                const x = this.updateOrder[i],
                      cellIdx = this.getIdx(x, y),
                      cellVal = this.grid[cellIdx];
                
                if(cellVal < 0) continue;

                const belowIdx = this.getIdx(x, y + 1),
                      belowVal = this.grid[belowIdx];
                if(belowVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[belowIdx] = cellVal;
                    this.toRedraw[cellIdx] = 2;
                    this.toRedraw[belowIdx] = 2;
                    continue;
                }

                const leftIdx = this.getIdxWrap(x - 1, y + 1),
                      leftVal = this.grid[leftIdx];
                if(leftVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[leftIdx] = cellVal;
                    this.toRedraw[cellIdx] = 2;
                    this.toRedraw[leftIdx] = 2;
                    continue;
                }

                const rightIdx = this.getIdxWrap(x + 1, y + 1),
                      rightVal = this.grid[rightIdx];
                if(rightVal < 0){
                    this.grid[cellIdx] = -1;
                    this.grid[rightIdx] = cellVal;
                    this.toRedraw[cellIdx] = 2;
                    this.toRedraw[rightIdx] = 2;
                    continue;
                }
            }
        }
    }

    draw() {
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 4 * this.tetrisBlocksSize; y < this.gridHeight; ++y) {
                const idx = this.getIdx(x, y),
                      val = this.grid[idx],
                      redraw = this.toRedraw[idx],
                      drawY = y - 4 * this.maxBlockSize;
                if(redraw >= 1 && val >= 0){ 
                    this.ctx.fillStyle = this.colors[val];
                    this.ctx.fillRect(x * this.cellSize, drawY * this.cellSize, this.cellSize, this.cellSize);
                    this.toRedraw[idx] = 0;
                } else if (redraw >= 2) { // Do not redraw if this is full redraw
                    this.ctx.fillStyle = this.bgColor;
                    this.ctx.fillRect(x * this.cellSize, drawY * this.cellSize, this.cellSize, this.cellSize);
                    this.toRedraw[idx] = 0;
                }
            }
        }
    }

    resize() {
        const newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize),
              newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize) + 4 * this.maxBlockSize;
        
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

        this.toRedraw = new Array(this.gridWidth * this.gridHeight);
        this.toRedraw.fill(1); // 1 for all cells to redraw

        this.updateOrder = new Array(this.gridWidth);
        for(let i = 0; i < this.gridWidth; ++i) this.updateOrder[i] = i;

        this.clear();
    }

    mouseAction(cords, event) {
        if(event === "down"){
            this.mouseDown = true;
            this.mouseValue = (this.mouseValue % this.colors.length) + 1;
        }
        else if(event === "up") this.mouseDown = false;

        if(event === "down" || (event === "move" && this.mouseDown)){
            const x = Math.floor(cords.x / this.cellSize),
                  y = Math.floor(cords.y / this.cellSize);
            this.mouseCellCord = x + (y + 4 * this.maxBlockSize) * this.gridWidth;
            
            if(this.grid[this.mouseCellCord] < 0){
                this.grid[this.mouseCellCord] = this.mouseValue;
                this.toRedraw[this.mouseCellCord] = 1;
                this.draw();
            }
        }
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 2, max: 12, toCall: "resize"},
                {prop: "spawnTetrisBlocks", type: "bool"},
                {prop: "tetrisBlocksSize", type: "int", min: 1, max: this.maxBlockSize, toCall: "generateBlocks"},
                {prop: "spawnASand", type: "text", value: "<click/touch>"},
                this.getSeedSettings()];
    }
}

module.exports = SandAutomata;
