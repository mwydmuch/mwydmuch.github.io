'use strict';

const NAME = "Color Pong",
      FILE = "pong.js",
      DESC = `
A variant of pong with two colors fighting for territory.

Coded by me (Marek Wydmuch) in 2025, with no external dependencies, using only canvas API.
`;

const GridAnimation = require("../grid-animation");
const Utils = require("../utils");

class Pong extends GridAnimation {
    constructor (canvas, colors, colorsAlt, bgColor,
                 cellSize = 16,
                 speed = 1,
                 numBallsPerColor = 1
                ) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        
        this.cellSize = cellSize;
        this.halfCellSize = cellSize / 2;
        this.speed = speed;
        this.resetOnResize = true;
        this.numBallsPerColor = numBallsPerColor;
        this.balls = [];
    }

    newCellState(x, y) {
        console.log("newCellState", x, y, this.gridWidth);
        // Left half is main color (1), right half is background color (0)
        if (x < this.gridWidth / 2) return 1;
        else return 0;
    }

    resize() {
        super.resize();

        // Reset balls
        this.balls = [];
        const halfCanvasWidth = this.canvas.width / 2;
        for (let i = 0; i < this.numBallsPerColor; i++) {
            // Ball 0 - starts on left side (main color side) with background color
            this.balls.push({
                x: Utils.randomRange(this.cellSize, halfCanvasWidth - this.cellSize, this.rand),
                y: Utils.randomRange(this.cellSize, this.canvas.height - this.cellSize, this.rand),
                vx: 1,
                vy: 1,
                color: this.bgColor,
                colorIndex: 0 // 0 for background color
            });
        
            // Ball 1 - starts on right side (background color side) with main color
            this.balls.push({
                x: Utils.randomRange(halfCanvasWidth + this.cellSize, this.canvas.width - this.cellSize, this.rand),
                y: Utils.randomRange(this.cellSize, this.canvas.height - this.cellSize, this.rand),
                vx: -1,
                vy: 1,
                color: this.mainColor,
                colorIndex: 1 // 1 for main color
            });
        }
    }

    ballGridCollision(ball) {
        let hitSameColor = false;
        let hitFromX = false;
        let hitFromY = false;

        // Check the cell the ball is in and surrounding cells
        for (let dy = -Math.floor(this.halfCellSize); dy <= Math.ceil(this.halfCellSize); dy += this.halfCellSize) {
            for (let dx = -Math.floor(this.halfCellSize); dx <= Math.ceil(this.halfCellSize); dx += this.halfCellSize) {
                const checkX = ball.x + dx;
                const checkY = ball.y + dy;
                const cellCheckX = Math.floor(checkX / this.cellSize);
                const cellCheckY = Math.floor(checkY / this.cellSize);

                if (checkX >= 0 && checkX < this.canvas.width && 
                    checkY >= 0 && checkY < this.canvas.height) {
                    const cellIdx = this.getIdx(cellCheckX, cellCheckY);
                    const cellColor = this.grid[cellIdx];
                    
                    // If the cell matches the ball's color, bounce and flip it
                    if (cellColor === ball.colorIndex) {
                        // Check if we just entered this same-colored cell
                        const wasInThisCell = (checkX >= ball.x - this.halfCellSize && 
                                               checkX <= ball.x + this.halfCellSize &&
                                               checkY >= ball.y - this.halfCellSize && 
                                               checkY <= ball.y + this.halfCellSize);
                        if (!wasInThisCell) {
                            hitSameColor = true;
                            // Flip the cell to opposite color
                            this.grid[cellIdx] = ball.colorIndex == 1 ? 0 : 1;
                            
                            // Determine bounce direction based on which direction we came from
                            if (checkX != ball.x) hitFromX = true;
                            if (checkY != ball.y) hitFromY = true;
                        }
                    }
                    // If the cell is opposite color, just pass through (do nothing)
                }
            }
        }

        // Bounce off same color blocks
        if (hitSameColor) {
            if (hitFromX && hitFromY) {
                // Hit corner, bounce both directions
                ball.vx = -ball.vx;
                ball.vy = -ball.vy;
            } else if (hitFromX) {
                // Hit from horizontal direction
                ball.vx = -ball.vx;
            } else if (hitFromY) {
                // Hit from vertical direction
                ball.vy = -ball.vy;
            }
        }
    }

    updateBall(ball, elapsed) {
        // Store previous position for collision detection
        const prevX = ball.x;
        const prevY = ball.y;

        // Check if ball collides with same color block
        this.ballGridCollision(ball);

        // Move ball
        ball.x += ball.vx * this.speed * elapsed * 0.01;
        ball.y += ball.vy * this.speed * elapsed * 0.01;

        // Check for collisions with the grid again after moving
        this.ballGridCollision(ball);

        // Bounce off edges
        if (ball.x < this.halfCellSize) {
            ball.x = this.halfCellSize;
            ball.vx = 1;
        } else if (ball.x >= this.canvas.width - this.halfCellSize) {
            ball.x = this.canvas.width - this.halfCellSize;
            ball.vx = -1;
        }

        if (ball.y < this.halfCellSize) {
            ball.y = this.halfCellSize;
            ball.vy = 1;
        } else if (ball.y >= this.canvas.height - this.halfCellSize) {
            ball.y = this.canvas.height - this.halfCellSize;
            ball.vy = -1;
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
        for (let ball of this.balls) Utils.fillCircle(this.ctx, ball.x, ball.y, this.halfCellSize, ball.color);
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        
        // Update ball colors
        this.ball0.color = this.bgColor;
        this.ball1.color = this.mainColor;
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 32, toCall: "restart"},
                {prop: "numBallsPerColor", name: "balls per color", type: "int", min: 1, max: 10, toCall: "restart"},
                {prop: "speed", type: "float", step: 0.1, min: 0.1, max: 10},
                this.getSeedSettings()];
    }
}

module.exports = Pong;
