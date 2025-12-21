'use strict';

const NAME = "Color Pong",
      FILE = "pong.js",
      DESC = `
A variant of pong with two colors fighting for territory.

Uses only Canvas API.
Coded by me (Marek Wydmuch) in 2025.
`;

const GridAnimation = require("../grid-animation");
const Utils = require("../utils");

class Pong extends GridAnimation {
    constructor (canvas, colors, colorsAlt, bgColor,
                 cellSize = 24,
                 speed = 1,
                 numBallsPerColor = 2
                ) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        
        this.cellSize = cellSize;
        this.halfCellSize = cellSize / 2;
        this.speed = speed;
        this.resetOnResize = true;
        this.numBallsPerColor = numBallsPerColor;
        this.balls = [];
    }

    newCellState(x, y, newGridWidth, newGridHeight) {
        // Left half is main color (1), right half is background color (0)
        if (x < (newGridWidth / 2 - 1)) return 1;
        else return 0;
    }

    resize() {
        super.resize();
        this.halfCellSize = this.cellSize / 2;
        
        // Reset balls
        this.balls = [];
        const halfCanvasWidth = this.canvas.width / 2;
        for (let i = 0; i < this.numBallsPerColor; i++) {
            const angleLeft = Utils.randomRange(0, Math.PI * 2, this.rand),
                  angleRight = Utils.randomRange(0, Math.PI * 2, this.rand);
            
            // Ball 0 - starts on left side (main color side) with background color
            this.balls.push({
                x: Utils.randomRange(this.cellSize, halfCanvasWidth - this.cellSize, this.rand),
                y: Utils.randomRange(this.cellSize, this.canvas.height - this.cellSize, this.rand),
                vx: Math.cos(angleLeft),
                vy: Math.sin(angleLeft),
                colorIndex: 0
            });
        
            // Ball 1 - starts on right side (background color side) with main color
            this.balls.push({
                x: Utils.randomRange(halfCanvasWidth + this.cellSize, this.canvas.width - this.cellSize, this.rand),
                y: Utils.randomRange(this.cellSize, this.canvas.height - this.cellSize, this.rand),
                vx: Math.cos(angleRight),
                vy: Math.sin(angleRight),
                colorIndex: 1
            });
        }
    }

    ballGridCollision(ball, nextX, nextY) {
        let bounceX = false,
            bounceY = false,
            flipped = new Set();

        const radius = this.halfCellSize,
              minCellX = Math.floor((nextX - radius) / this.cellSize),
              maxCellX = Math.floor((nextX + radius) / this.cellSize),
              minCellY = Math.floor((nextY - radius) / this.cellSize),
              maxCellY = Math.floor((nextY + radius) / this.cellSize),
              epsilon = 0.0001;

        for (let cy = minCellY; cy <= maxCellY; cy++) {
            if (cy < 0 || cy >= this.gridHeight) continue;
            for (let cx = minCellX; cx <= maxCellX; cx++) {
                if (cx < 0 || cx >= this.gridWidth) continue;
                const cellIdx = this.getIdx(cx, cy),
                      cellColor = this.grid[cellIdx];

                if (cellColor !== ball.colorIndex) continue;

                // Flip the cell only once per check
                if (!flipped.has(cellIdx)) {
                    this.grid[cellIdx] = ball.colorIndex === 1 ? 0 : 1;
                    flipped.add(cellIdx);
                }

                const cellLeft = cx * this.cellSize,
                      cellRight = cellLeft + this.cellSize,
                      cellTop = cy * this.cellSize,
                      cellBottom = cellTop + this.cellSize;

                const overlapX = Math.min(nextX + radius, cellRight) - Math.max(nextX - radius, cellLeft),
                      overlapY = Math.min(nextY + radius, cellBottom) - Math.max(nextY - radius, cellTop);

                if (overlapX > 0 && overlapY > 0) {
                    if (overlapX + epsilon < overlapY) bounceX = true;
                    else if (overlapY + epsilon < overlapX) bounceY = true;
                    else {
                        bounceX = true;
                        bounceY = true;
                    }
                }
            }
        }

        return {bounceX, bounceY};
    }

    updateBall(ball, elapsed) {
        const elapsedSec = elapsed / 1000,
              totalStep = this.speed * elapsedSec * this.cellSize * 20; // scale with grid size for consistent feel
        if (totalStep <= 0) return;

        const subSteps = Math.max(1, Math.ceil(totalStep / this.halfCellSize)),
              step = totalStep / subSteps;

        for (let i = 0; i < subSteps; ++i) {
            let nextX = ball.x + ball.vx * step,
                nextY = ball.y + ball.vy * step;

            // Check grid collision (territory capture) before committing the move
            const {bounceX, bounceY} = this.ballGridCollision(ball, nextX, nextY);
            if (bounceX) {
                ball.vx = -ball.vx;
                nextX = ball.x + ball.vx * step;
            }
            if (bounceY) {
                ball.vy = -ball.vy;
                nextY = ball.y + ball.vy * step;
            }

            // Bounce off edges
            if (nextX < this.halfCellSize) {
                nextX = this.halfCellSize;
                ball.vx = Math.abs(ball.vx);
            } else if (nextX >= this.canvas.width - this.halfCellSize) {
                nextX = this.canvas.width - this.halfCellSize;
                ball.vx = -Math.abs(ball.vx);
            }

            if (nextY < this.halfCellSize) {
                nextY = this.halfCellSize;
                ball.vy = Math.abs(ball.vy);
            } else if (nextY >= this.canvas.height - this.halfCellSize) {
                nextY = this.canvas.height - this.halfCellSize;
                ball.vy = -Math.abs(ball.vy);
            }

            ball.x = nextX;
            ball.y = nextY;
        }
    }

    update(elapsed) {
        super.update(elapsed);

        // Update all balls
        for (let ball of this.balls) this.updateBall(ball, elapsed);
    }

    draw() {
        this.clear();

        // Draw grid
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                const cellVal = this.getVal(x, y);
                
                if (cellVal == 1) this.ctx.fillStyle = this.mainColor;
                else this.ctx.fillStyle = this.bgColor;
                
                this.ctx.fillRect(
                    x * this.cellSize, 
                    y * this.cellSize,
                    this.cellSize, 
                    this.cellSize
                );
            }
        }
        
        // Draw balls
        for (let ball of this.balls) {
            const color = ball.colorIndex === 1 ? this.mainColor : this.bgColor;
            Utils.fillCircle(this.ctx, ball.x, ball.y, this.halfCellSize, color);
        }
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        
        // Update ball colors
        for (let ball of this.balls) {
            // Colors are derived on draw; nothing else to do but ensure direction persists
            if (ball.colorIndex !== 0 && ball.colorIndex !== 1) ball.colorIndex = 0;
        }
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 8, max: 64, toCall: "restart"},
                {prop: "numBallsPerColor", name: "balls per color", type: "int", min: 1, max: 16, toCall: "restart"},
                {prop: "speed", type: "float", step: 0.1, min: 0.1, max: 10},
                this.getSeedSettings()];
    }
}

module.exports = Pong;
