'use strict';

const NAME = "sand automata",
      FILE = "sand-automata.js",
      DESC = `
Sand automata.

This cellular automata is a simple model of falling sand.
The automata is updated in place, from the bottom to the top.
The cell can "fall" down to the cell below it if the cell is empty. 
If not it can move to the below left or right if one of those cells is empty.
To reduce the bias of falling to the left or right, 
the cells in each row are updated in random order.

It generates random tetris blocks and lets them fall to demonstrate
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
        this.maxBlockSize = 12;

        this.updateOrder = null;
        this.fullRows = 0;

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
        if(this.mouseDown) this.grid[this.mouseCellCord] = this.mouseValue;
        
        // Detections of full rows, to speed up the drawing
        this.fullRows = 0;
        let rowFull = true;
        for (let x = 0; x < this.gridWidth; ++x){
            if(this.getVal(x, this.gridHeight - 1) < 0){
                rowFull = false;
                break;
            }
        }
        if(rowFull) ++this.fullRows;
        
        // Update grid
        for (let y = this.gridHeight - 2; y >= 0; --y) {
            rowFull = true;
            Utils.randomShuffle(this.updateOrder, this.rand);
            for (let i = 0; i < this.gridWidth; ++i) {
                const x = this.updateOrder[i],
                      cellIdx = this.getIdx(x, y),
                      cellVal = this.grid[cellIdx];
                
                if(cellVal < 0){
                    rowFull = false;
                    continue;
                }

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
            if(rowFull) ++this.fullRows;
        }
    }

    draw() {
        // Only clear the rows that are not full (optimization)
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height - (this.fullRows - 1) * this.cellSize); 

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 4 * this.tetrisBlocksSize; y < this.gridHeight - (this.fullRows - 1); ++y) {
                const val = this.getVal(x, y),
                      drawY = y - 4 * this.maxBlockSize;
                if(val >= 0){ // Do not draw if the state is the first state (small optimization)
                    this.ctx.fillStyle = this.colors[val];
                    this.ctx.fillRect(x * this.cellSize, drawY * this.cellSize, this.cellSize, this.cellSize);
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
            
            if(this.grid[this.mouseCellCord] !== this.mouseValue){
                this.grid[this.mouseCellCord] = this.mouseValue;
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
