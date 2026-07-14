'use strict';

const NAME = "Perlin noise grid",
      FILE = "perlin-noise-grid.js",
      TAGS = ["framerate-independent", "2d", "perlin noise", "grid"],
      DESC = `
Grid of squares or circles with size driven by animated Perlin noise.
Optional sigmoid function with controlable alpha 
can be applied to the noise to make the size distribution more extreme.

Uses only Canvas API.
Coded by me (Marek Wydmuch) in 2025.
`;

const Animation = require("../animation");
const Utils = require("../utils");

class PerlinNoiseGrid extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                cellSize = 12,
                cellPadding = -4,
                cellStyle = "random",
                noiseScale = 0.002,
                noiseSpeed = {x: "random", y: "random", z: 10},
                applySigmoid = true,
                sigmoidAlpha = 4
            ) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.cellSize = cellSize;
        this.cellPadding = cellPadding;
        this.cellStyles = ["square", "circle"];
        this.cellStyle = this.assignIfRandom(cellStyle, Utils.randomChoice(this.cellStyles));
        this.noiseScale = noiseScale;
        this.noiseSpeed = noiseSpeed;
        this.noiseSpeed.x = this.assignIfRandom(this.noiseSpeed.x, Utils.round(Utils.randomRange(-10, 10), 1));
        this.noiseSpeed.y = this.assignIfRandom(this.noiseSpeed.y, Utils.round(Utils.randomRange(-10, 10), 1));
        this.applySigmoid = applySigmoid;
        this.sigmoidAlpha = sigmoidAlpha;

        this.gridCellsWidth = 0;
        this.gridCellsHeight = 0;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.noisePos = {x: 0, y: 0, z: 0};
    }

    update(elapsedMs) {
        const elapsedSec = super.update(elapsedMs);
        this.noisePos.x += this.noiseSpeed.x * elapsedSec * 10;
        this.noisePos.y += this.noiseSpeed.y * elapsedSec * 10;
        this.noisePos.z += this.noiseSpeed.z * elapsedSec * 0.05;
    }

    drawSquareCell(x, y, size) {
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }

    drawCircleCell(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, 2 * Math.PI, false);
        this.ctx.fill();
    }

    draw() {
        this.clear();

        const offsetX = -(this.gridWidth - this.canvas.width) / 2,
              offsetY = -(this.gridHeight - this.canvas.height) / 2,
              maxCellSize = Math.max(0, this.cellSize - 2 * this.cellPadding),
              drawCell = this.cellStyle === "square" ? this.drawSquareCell : this.drawCircleCell;

        for(let y = 0; y < this.gridCellsHeight; ++y) {
            const cellY = offsetY + y * this.cellSize + this.cellSize / 2;
            for(let x = 0; x < this.gridCellsWidth; ++x) {
                const cellX = offsetX + x * this.cellSize + this.cellSize / 2,
                      noiseVal = this.noise.perlin3(
                          (cellX + this.noisePos.x) * this.noiseScale,
                          (cellY + this.noisePos.y) * this.noiseScale,
                          this.noisePos.z),
                      noiseNorm = this.applySigmoid
                          ? 1 / (1 + Math.exp(-this.sigmoidAlpha * noiseVal))
                          : Utils.clip(Utils.remap(noiseVal, -1, 1, 0, 1), 0, 1),
                      size = maxCellSize * noiseNorm;

                if(size > 0.1) {
                    this.ctx.fillStyle = Utils.lerpColorHex(this.colorsAlt[0], this.colors[0], noiseNorm);
                    drawCell.call(this, cellX, cellY, size);
                }
            }
        }
    }

    restart(){
        this.noisePos = {x: 0, y: 0, z: 0};
        super.restart();
    }

    resize() {
        super.resize();

        this.gridCellsWidth = Math.ceil(this.canvas.width / this.cellSize);
        this.gridCellsHeight = Math.ceil(this.canvas.height / this.cellSize);
        this.gridWidth = this.gridCellsWidth * this.cellSize;
        this.gridHeight = this.gridCellsHeight * this.cellSize;
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.restart();
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 64, toCall: "resize"},
                {prop: "cellPadding", type: "float", step: 1, min: -8, max: 8},
                {prop: "cellStyle", type: "select", values: this.cellStyles},
                {prop: "applySigmoid", type: "bool"},
                {prop: "sigmoidAlpha", type: "float", step: 0.1, min: 0.1, max: 20},
                {prop: "noiseScale", type: "float", step: 0.0001, min: 0.0005, max: 0.0125},
                {prop: "noiseSpeed.x", type: "float", step: 0.1, min: -10, max: 10},
                {prop: "noiseSpeed.y", type: "float", step: 0.1, min: -10, max: 10},
                {prop: "noiseSpeed.z", type: "float", step: 0.1, min: -10, max: 10},
                this.getSeedSettings()];
    }
}

module.exports = PerlinNoiseGrid;
