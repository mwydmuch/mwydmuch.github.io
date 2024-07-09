'use strict';

const NAME = "isometric Conway's game of life",
      FILE = "game-of-life-isometric.js",
      DESC = `
Conway's game of life visualization with isometric rendering.
You can read about the game of life on
[Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life).
Game of life is one of the first programs I wrote in my life.

As in the [top-down version](https://mwydmuch.pl/animations?animation=game-of-life),
cells leave a trace for a few steps after they die to achieve a nice effect.
Especially, cells that died in the previous step keep the appearance 
of the life cell resulting in a stable image 
since flickering is not that good for a background image.

My other cellular automata visualizations:
- [Conway's game of life](https://mwydmuch.pl/animations?animation=game-of-life)
- [Brain's brain](https://mwydmuch.pl/animations?animation=brains-brain-automata)
- [day and night](https://mwydmuch.pl/animations?animation=day-and-night-automata)
- [isometric game of life](https://mwydmuch.pl/animations?animation=game-of-life-isometric)
- [rock paper scissors](https://mwydmuch.pl/animations?animation=rock-paper-scissors-automata)
- [sand automata](https://mwydmuch.pl/animations?animation=sand-automata)

Coded with no external dependencies, using only canvas API.
`;

const GameOfLife = require("./game-of-life");
const Utils = require("../utils");

class GameOfLifeIsometric extends GameOfLife {
    constructor (canvas, colors, colorsAlt, bgColor,
                 cellSize = 14,
                 cellBasePadding = 0,
                 spawnProb = 0.4,
                 fadeDeadCells = true,
                 drawCellsGrid = true,
                 loopGrid = true,
                 gridSize = 3/4) {
        super(canvas, colors, colorsAlt, bgColor, cellSize, cellBasePadding, spawnProb, loopGrid);

        this.name = NAME;
        this.file = FILE;
        this.description = DESC;
        this.fadeDeadCells = fadeDeadCells;
        this.drawCellsGrid = drawCellsGrid;
        this.gridSize = gridSize;

        this.sqrt3 = Math.sqrt(3);
        this.xShift = this.cellSize * this.sqrt3 / 2;
        this.yShift = this.cellSize / 2;

        // Prerender cubes for better performance
        this.renderedGrid = null;
        this.renderedCubes = [];
        let offCtx = Utils.createOffscreenCanvas(4 * this.xShift, 4 * this.yShift).getContext('2d');
        this.drawIsoCube(offCtx, 0, 3 * this.yShift, true, true, this.colors, 0, this.cellSize);
        this.renderedCubes.push(offCtx.canvas);

        for(let i = 1; i < this.cellSize; ++i){
            offCtx = Utils.createOffscreenCanvas(4 * this.xShift, 4 * this.yShift).getContext('2d');
            this.drawIsoCube(offCtx, 0, 3 * this.yShift, true, true, this.colorsAlt, -i, this.cellSize);
            this.renderedCubes.push(offCtx.canvas);
        }
    }

    drawIsoCube(ctx, isoX, isoY, drawFront, drawSide, colors, heightMod, size) {
        const xShift = size * this.sqrt3 / 2,
              yShift = size / 2;

        heightMod *= -1; //*= -2 * yShift;
        ctx.strokeStyle = colors[0];

        ctx.fillStyle = colors[3];
        ctx.beginPath();
        Utils.pathClosedShape(ctx,[
            [isoX, isoY - 2 * yShift + heightMod],
            [isoX + xShift, isoY - yShift + heightMod],
            [isoX + 2 * xShift, isoY - 2 * yShift + heightMod],
            [isoX + xShift, isoY - 3 * yShift + heightMod]]);
        ctx.fill();
        ctx.stroke();

        if(drawFront) { // Small optimization
            ctx.fillStyle = colors[2];
            ctx.beginPath();
            Utils.pathClosedShape(ctx, [
                [isoX, isoY],
                [isoX + xShift, isoY + yShift],
                [isoX + xShift, isoY - yShift + heightMod],
                [isoX, isoY - 2 * yShift + heightMod]]);
            ctx.fill();
            ctx.stroke();
        }

        if(drawSide) { // Small optimization
            ctx.fillStyle = colors[1];
            ctx.beginPath();
            Utils.pathClosedShape(ctx, [
                [isoX + xShift, isoY + yShift],
                [isoX + 2 * xShift, isoY],
                [isoX + 2 * xShift, isoY - 2 * yShift + heightMod],
                [isoX + xShift, isoY - yShift + heightMod]]);
            ctx.fill();
            ctx.stroke();
        }
    }

    drawCube(x, y, colors, heightMod=0, padding=0) {
        const isoX = x * this.xShift - y * this.xShift,
              isoY = (x + y + 1) * this.yShift;

        this.drawIsoCube(this.ctx, isoX, isoY, !this.isAlive(x, y + 1), !this.isAlive(x + 1, y), colors, heightMod, this.cellSize - 2 * padding);
    }

    drawGrid(ctx, x, y){
        const westX = this.gridHeight * -this.xShift,
              westY = this.gridHeight * this.yShift,
              eastX = this.gridWidth * this.xShift,
              eastY = this.gridWidth * this.yShift,
              southX = (-this.gridHeight + this.gridWidth) * this.xShift,
              southY = (this.gridHeight + this.gridWidth) * this.yShift,
              color = this.colors[0];

        // Draw grid
        for (let i = 0; i < this.gridHeight; ++i) {
            const x = i * -this.xShift,
                y = i * this.yShift;
            Utils.drawLine(ctx, x, y, x + eastX, y + eastY, 1, color);
            Utils.drawLine(ctx, -x, y, -x + westX, y + westY, 1, color);
        }

        // Draw outline
        Utils.drawLine(ctx, 0, 0, eastX, eastY, 3, color);
        Utils.drawLine(ctx, 0, 0, westX, westY, 3, color);
        Utils.drawLine(ctx, westX, westY, southX, southY, 3, color);
        Utils.drawLine(ctx, eastX, eastY, southX, southY, 3, color);
    }

    drawPrerenderedCube(x, y, idx){
        const isoX = x * this.xShift - y * this.xShift,
              isoY = (x + y + 1) * this.yShift;

        this.ctx.drawImage(this.renderedCubes[idx], isoX - 1 * this.xShift, isoY - 3 * this.yShift);
    }

    mouseCellCord(mouseX, mouseY) {

    }

    draw() {
        this.clear();

        // Draw grid
        if(this.drawCellsGrid) {
            if (!this.renderedGrid) {
                let offCtx = Utils.createOffscreenCanvas(this.ctx.canvas.width, this.ctx.canvas.height).getContext('2d');
                offCtx.translate(this.ctx.canvas.width / 2, (1 - this.gridSize) / 2 * this.ctx.canvas.height);
                this.drawGrid(offCtx, 0, 0);
                this.renderedGrid = offCtx.canvas;
            }
            this.ctx.drawImage(this.renderedGrid, 0, 0);
        }

        this.ctx.translate(this.ctx.canvas.width / 2, (1 - this.gridSize) / 2 * this.ctx.canvas.height);

        // Draw blocks
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let cellVal = this.getVal(x, y);
                if(this.fadeDeadCells && cellVal > -(this.cellSize - 2 * this.cellBasePadding))
                    //this.drawCube(x, y, this.colorsAlt, Math.min(0, cellVal), this.cellBasePadding);
                    this.drawPrerenderedCube(x, y, Math.max(0, -cellVal));
                else if (cellVal > 0) this.drawPrerenderedCube(x, y, 0);
            }
        }

        this.ctx.resetTransform();
    }

    resize() {
        // Fill the whole screen (bad performance on low spec computers/mobile devices)
        //const newGridSize = Math.ceil((this.ctx.canvas.height + this.isoH) / this.cellSize);
        const smallerSize = Math.min(this.ctx.canvas.width, this.ctx.canvas.height),
              newGridSize = Math.ceil(this.gridSize * smallerSize / this.cellSize);
        this.resizeGrid(newGridSize, newGridSize);
        this.renderedGrid = null;
    }

    getSettings() {
        return [{prop: "loopGrid", type: "bool"},
                {prop: "fadeDeadCells", type: "bool"},
                {prop: "drawCellsGrid", type: "bool"},
                {prop: "gridSize", type: "float", step: 0.01, min: 0, max: 2, toCall: "resize"},
                {prop: "spawnProb", type: "float", step: 0.01, min: 0, max: 1, toCall: "restart"},
                this.getSeedSettings()];
    }
}

module.exports = GameOfLifeIsometric;
