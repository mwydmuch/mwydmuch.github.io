/*
 * Conway's game of life visualization with isometric rendering.
 * Cells that "died" in the previous step keep their color to achieve a stable image
 * since flickering is not good for a background image.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const GameOfLife = require("./game-of-live");
const Utils = require("./utils");

class GameOfLifeIsometric extends GameOfLife {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 12,
                 cellBasePadding = 0,
                 spawnProb = 0.5,
                 fadeDeadCells = true) {
        super(canvas, colors, colorsAlt, cellSize, cellBasePadding, spawnProb);
        this.name = "isometric Conway's game of life";
        this.file = "game-of-live-isometric.js";
        this.fadeDeadCells = fadeDeadCells;

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
            Utils.drawLine(ctx, x, y, x + eastX, y + eastY, color);
            Utils.drawLine(ctx, -x, y, -x + westX, y + westY, color);
        }

        // Draw outline
        Utils.drawLine(ctx, 0, 0, eastX, eastY, color, 3);
        Utils.drawLine(ctx, 0, 0, westX, westY, color, 3);
        Utils.drawLine(ctx, westX, westY, southX, southY, color, 3);
        Utils.drawLine(ctx, eastX, eastY, southX, southY, color, 3);
    }

    drawPrerenderedCube(x, y, idx){
        const isoX = x * this.xShift - y * this.xShift,
              isoY = (x + y + 1) * this.yShift;

        this.ctx.drawImage(this.renderedCubes[idx], isoX - 1 * this.xShift, isoY - 3 * this.yShift);
    }

    draw() {
        Utils.clear(this.ctx, this.bgColor);

        // Draw grid
        if(!this.renderedGrid){
            let offCtx = Utils.createOffscreenCanvas(this.ctx.canvas.width, this.ctx.canvas.height).getContext('2d');
            offCtx.translate(this.ctx.canvas.width / 2, 1/8 * this.ctx.canvas.height);
            this.drawGrid(offCtx, 0, 0);
            this.renderedGrid = offCtx.canvas;
        }
        this.ctx.drawImage(this.renderedGrid, 0, 0);

        this.ctx.translate(this.ctx.canvas.width / 2, 1/8 * this.ctx.canvas.height);

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

        const newGridSize = Math.ceil( 3/4 * this.ctx.canvas.height / this.cellSize);
        this.resizeGrid(newGridSize, newGridSize);
        this.renderedGrid = null;
    }

    getSettings() {
        return [{prop: "fadeDeadCells", type: "bool"}];
    }
}

module.exports = GameOfLifeIsometric;
