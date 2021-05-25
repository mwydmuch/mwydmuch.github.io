var canvas = document.getElementById("background");
var ctx = canvas.getContext("2d", { alpha: false });
var container = document.getElementById('container');
ctx.canvas.width  = Math.max(container.offsetWidth, window.innerWidth);
ctx.canvas.height = Math.max(container.offsetHeight, window.innerHeight);

ctx.fillStyle = "#FFFFFF";
ctx.fillRect(0, 0, canvas.width, canvas.height);

var fps = 15;
var fpsInterval = 1000 / fps;
var then = Date.now();
// var colors = [ // Green
//     "#678786",
//     "#92ABA1",
//     "#A5BFBC",
//     "#C5D1D2"
// ]

var colors = [ // Grey
    "#777777",
    "#888888",
    "#999999",
    "#AAAAAA"
]


class GameOfLife {
    constructor (ctx, cellSize)
    {
        this.ctx = canvas.getContext("2d", { alpha: false });
        this.cellSize = cellSize;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = null;
        this.gridNextState = null;
        this.resize();
    }

    getCord(x, y) {
        return x + y * this.gridWidth;
    }

    update(elapsed){
        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let numAlive = this.isAlive(x - 1, y - 1)
                    + this.isAlive(x, y - 1)
                    + this.isAlive(x + 1, y - 1)
                    + this.isAlive(x - 1, y)
                    + this.isAlive(x + 1, y)
                    + this.isAlive(x - 1, y + 1)
                    + this.isAlive(x, y + 1)
                    + this.isAlive(x + 1, y + 1);
                let cellCord = this.getCord(x, y);
                if (numAlive == 2 && this.grid[cellCord] == 1) this.gridNextState[cellCord] = this.grid[cellCord];
                else if (numAlive == 3) this.gridNextState[cellCord] = 1;
                else this.gridNextState[cellCord] = this.grid[cellCord] - 1;
            }
        }

        [this.grid, this.gridNextState] = [this.gridNextState, this.grid];
    }

    isAlive(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return false;
        else return (this.grid[this.getCord(x, y)] == 1) ? 1 : 0;
    }

    draw() {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (let y = 0; y < this.gridHeight; ++y) {
            for (let x = 0; x < this.gridWidth; ++x) {
                let cellVal = this.grid[this.getCord(x, y)];
                //let cellPadding = 1 - Math.min(0, cellVal);
                let cellPadding = 1
                let fillStyle = null;
                if(cellVal >= 0 ) fillStyle = colors[0];
                else if(cellVal >= -2){
                    fillStyle = colors[1];
                    cellPadding += 1
                }
                else if(cellVal >= -4){
                    fillStyle = colors[2];
                    cellPadding += 2
                }
                else if(cellVal >= -16){
                    fillStyle = colors[3];
                    cellPadding += 3
                }
                if(fillStyle) {
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.fillRect(x * this.cellSize + cellPadding,
                        y * this.cellSize + cellPadding,
                        this.cellSize - 2 * cellPadding,
                        this.cellSize - 2 * cellPadding);
                }
            }
        }
    }

    resize() {
        console.log("resize", this.ctx.canvas.width, this.ctx.canvas.height);

        let newGridWidth = Math.ceil(this.ctx.canvas.width / this.cellSize);
        let newGridHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        let newGrid = new Array(newGridWidth * newGridHeight);

        for (let y = 0; y < newGridHeight; y++) {
            for (let x = 0; x < newGridWidth; x++) {
                let cellCord = x + y * newGridWidth;
                if(x < this.gridWidth && y < this.gridHeight) newGrid[cellCord] = this.grid[this.getCord(x, y)];
                else newGrid[cellCord] = (Math.random() > 0.5) ? 1 : 0;
            }
        }

        this.grid = newGrid;
        this.gridNextState = [...this.grid];
        this.gridWidth = newGridWidth;
        this.gridHeight = newGridHeight;
    }
}

var animation = new GameOfLife(canvas, 10);

function onResize() {
    ctx.canvas.width  = Math.max(container.offsetWidth, window.innerWidth);
    ctx.canvas.height = Math.max(container.offsetHeight, window.innerHeight);
    animation.resize();
}

function checkResize(mutationsList, observer) {
    for(mutation of mutationsList)
        console.log(mutation);
}

window.addEventListener('resize', onResize);
var observer = new MutationObserver(checkResize);

function render() {
    requestAnimationFrame(render);

    let now = Date.now();
    let elapsed = now - then;
    if (elapsed < fpsInterval) return;
    then = now;

    animation.update(elapsed);
    animation.draw();
}

render();
