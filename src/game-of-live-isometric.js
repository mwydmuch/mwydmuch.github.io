/*
 * Conway's Game of Life visualization with isometric rendering.
 * Cells that "died" in the previous step keep their color to achieve a stable image
 * (flickering is not good for a background image).
 *
 * Coded with no external dependencies, using only canvas API.
 */

const GameOfLife = require("./game-of-live");
const Utils = require("./utils");

class GameOfLifeIsometric extends GameOfLife {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 10,
                 cellBasePadding = 0,
                 spawnProb = 0.3) {
        super(canvas, colors, colorsAlt, cellSize, cellBasePadding, spawnProb);
        this.name = "Isometric Conway's Game of Life";
        this.file = "game-of-live-isometric.js";

        this.sqrt3 = Math.sqrt(3);
        this.xShift = this.cellSize * this.sqrt3 / 2;
        this.yShift = this.cellSize / 2;
        this.isoHeight = 0;

        // Prerender cubes for better performance
        this.cubes = [];
        let offCtx = Utils.createOffscreenCanvas(4 * this.xShift, 4 * this.yShift).getContext('2d');
        this.drawIsoCube(offCtx, 0, 3 * this.yShift, true, true, this.colors, 0, this.cellSize);
        this.cubes.push(offCtx.canvas);

        for(let i = 1; i < this.cellSize; ++i){
            offCtx = Utils.createOffscreenCanvas(4 * this.xShift, 4 * this.yShift).getContext('2d');
            this.drawIsoCube(offCtx, 0, 3 * this.yShift, true, true, this.colorsAlt, -i, this.cellSize);
            this.cubes.push(offCtx.canvas);
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
        const isoX = x * this.xShift - y * this.xShift + padding * this.sqrt3,
              isoY = (x + y) * this.yShift;

        if(isoX >= 0 && isoX < this.ctx.canvas.width && isoY >= 0 && isoY < this.ctx.canvas.height)
            this.drawIsoCube(this.ctx, isoX, isoY, !this.isAlive(x, y + 1), !this.isAlive(x + 1, y), colors, heightMod, this.cellSize - 2 * padding);
    }

    drawPrerenderedCube(x, y, idx){
        const isoX = x * this.xShift - y * this.xShift + this.ctx.canvas.width / 2,
              isoY = (x + y + 1) * this.yShift - this.isoH / 2;

        // const isoX = x * this.xShift - y * this.xShift,
        //    isoY = (x + y + 1) * this.yShift;

        if(isoX >= 0 && isoX < this.ctx.canvas.width && isoY >= 0 && isoY < this.ctx.canvas.height)
            this.ctx.drawImage(this.cubes[idx], isoX, isoY);
    }

    draw() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = this.colors[0];
        const alignHeight = Math.floor(this.ctx.canvas.width / this.cellSize) * this.cellSize,
              isoHeight = this.ctx.canvas.width / this.sqrt3;
        for(let i = -alignHeight; i < this.ctx.canvas.height; i += this.cellSize)
            Utils.drawLine(this.ctx, 0, i, this.ctx.canvas.width, i + isoHeight);

        for(let i = 0; i < this.ctx.canvas.height + alignHeight; i += this.cellSize)
            Utils.drawLine(this.ctx, 0, i, this.ctx.canvas.width, i - isoHeight);

        this.ctx.translate(this.ctx.canvas.width / 2, -this.isoH / 2);

        // Draw blocks
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let cellVal = this.getVal(x, y);
                if(cellVal > -(this.cellSize - 2 * this.cellBasePadding))
                    //this.drawCube(x, y, this.colorsAlt, Math.min(0, cellVal), this.cellBasePadding);
                    this.drawPrerenderedCube(x, y, Math.max(0, -cellVal));
            }
        }

        this.ctx.resetTransform();
    }

    resize() {
        this.isoH = this.ctx.canvas.width / this.sqrt3;
        const newGridSize = Math.ceil((this.ctx.canvas.height + this.isoH) / this.cellSize);
        this.resizeGrid(newGridSize, newGridSize);
    }
}

module.exports = GameOfLifeIsometric;
