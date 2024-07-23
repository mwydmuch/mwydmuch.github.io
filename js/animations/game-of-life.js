'use strict';

const NAME = "Conway's game of life",
      FILE = "game-of-life.js",
      DESC = `
Voisualization of Conway's game of life - probably the most famous cellular automata.
You can read about the game of life on
[Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
or [LifeWiki](https://conwaylife.com/wiki/Conway%27s_Game_of_Life) (it's a great website).
Game of life is one of the first programs I wrote in my life.

In this version, cells leave a trace for 
a few steps after they die to achieve a nice effect.
Especially, cells that died in the previous step keep the appearance 
of the life cell resulting in a stable image 
since flickering is not that good for a background image.

You can pause the animation and set the cell states by clicking/touching the canvas.

My other cellular automata visualizations:
- [Brain's brain](https://mwydmuch.pl/animations?animation=brains-brain-automata)
- [day and night automata](https://mwydmuch.pl/animations?animation=day-and-night-automata)
- [glitch automata](https://mwydmuch.pl/animations?animation=glitch-automata)
- [isometric game of life](https://mwydmuch.pl/animations?animation=game-of-life-isometric)
- [rock paper scissors](https://mwydmuch.pl/animations?animation=rock-paper-scissors-automata)
- [sand automata](https://mwydmuch.pl/animations?animation=sand-automata)

Coded with no external dependencies, using only canvas API.
`;

const GridAnimation = require("../grid-animation");
const Utils = require("../utils");

class GameOfLife extends GridAnimation {
    constructor (canvas, colors, colorsAlt, bgColor,
                 cellSize = 12,
                 cellPadding = 1,
                 spawnProb = 0.4,
                 loopGrid = true,
                 cellStyle = "random",
                 deadCellsFadingSteps = 5,
                 deadCellsFadingStyle = "size+color") {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        
        this.cellSize = cellSize;
        this.cellBasePadding = cellPadding;
        this.initialPaterns = ["random", "R Pentomino"]; // not used at the moment
        this.spawnProb = spawnProb;
        this.cellStyles = ["square", "circle"];
        this.cellStyle = this.assignIfRandom(cellStyle, Utils.randomChoice(this.cellStyles));
        this.deadCellsFadingSteps = deadCellsFadingSteps;
        this.deadCellsFadingStyles = ["color", "size", "size+color"];
        this.deadCellsFadingStyle = this.assignIfRandom(deadCellsFadingStyle, Utils.randomChoice(this.deadCellsFadingStyles));
        this.loopGrid = loopGrid;

        this.mouseDown = false;
        this.mouseVal = 0;
    }

    isAlive(x, y) {
        if(!this.loopGrid) {
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return 0;
            else return (this.getVal(x, y) >= 1) ? 1 : 0;
        }
        else return (this.getValWrap(x, y) >= 1) ? 1 : 0;
    }

    numAliveInMooreNeighborhood(x, y) {
        return this.isAlive(x - 1, y - 1)
            + this.isAlive(x, y - 1)
            + this.isAlive(x + 1, y - 1)
            + this.isAlive(x - 1, y)
            + this.isAlive(x + 1, y)
            + this.isAlive(x - 1, y + 1)
            + this.isAlive(x, y + 1)
            + this.isAlive(x + 1, y + 1);
    }

    update(elapsed){
        super.update(elapsed);
        
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                const numAlive = this.numAliveInMooreNeighborhood(x, y),
                      cellIdx = this.getIdx(x, y);
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
            -(this.mapWidth * this.cellSize - this.canvas.width) / 2, 
            -(this.mapHeight * this.cellSize - this.canvas.height) / 2
        );

        if(this.cellStyle === "square") this.drawCell = this.drawSquareCell;
        else this.drawCell = this.drawCircleCell;

        const maxPadding = this.cellSize / 2 - this.cellBasePadding,
              paddingPerStep = maxPadding / (this.deadCellsFadingSteps + 1),
              sizeFade = this.deadCellsFadingStyle.includes("size"),
              colorFade = this.deadCellsFadingStyle.includes("color");
        
        let fadeColors = new Array(this.deadCellsFadingSteps);
        for (let i = 0; i < this.deadCellsFadingSteps; ++i) {
            fadeColors[i] = Utils.lerpColor(this.colors[0], this.bgColor, i / this.deadCellsFadingSteps);
        }

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
                            if(colorFade) fillStyle = fadeColors[i];
                            else fillStyle = this.colors[0];
                            if(sizeFade) cellPadding += i * paddingPerStep;
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

    mouseAction(cords, event) {
        if(event === "down") this.mouseDown = true;
        else if(event === "up") this.mouseDown = false;
        
        if(event === "down" || (event === "move" && this.mouseDown)){
            const cellCord = this.mouseCellCord(cords.x, cords.y);
            
            if(event === "down"){
                if (this.grid[cellCord] === 1) this.mouseVal = -99999;
                else this.mouseVal = 1;
            }
            
            if(this.grid[cellCord] !== this.mouseVal){
                this.grid[cellCord] = this.mouseVal;
                this.draw();
            }
        }
    }

    mouseCellCord(mouseX, mouseY) {
        const x = Math.floor(mouseX / this.cellSize),
              y = Math.floor(mouseY / this.cellSize);
        return x + y * this.gridWidth;
    }

    getSettings() {
        return [{prop: "changeGrid", type: "text", value: '<click/touch>'},
                {prop: "loopGrid", type: "bool"},
                {prop: "cellSize", type: "int", min: 4, max: 32, toCall: "restart"},
                {prop: "cellStyle", type: "select", values: this.cellStyles},
                {prop: "cellBasePadding", name: "cell padding", type: "bool"},
                {prop: "deadCellsFadingSteps", type: "int", min: 0, max: 8},
                {prop: "deadCellsFadingStyle", type: "select", values: this.deadCellsFadingStyles},
                {prop: "spawnProb", icon: '<i class="fa-solid fa-dice"></i>', type: "float", step: 0.01, min: 0, max: 1, toCall: "restart"},
                this.getSeedSettings()];
    }
}

module.exports = GameOfLife;
