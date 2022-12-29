'use strict';

const NAME = "finding the shortest path",
      FILE = "shortest-path.js",
      DESC = `
Animation showing process of finding the shortest path
in the grid world by BFS or A* algorithm.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");
const Queue = require("./queue");

const EMPTY = 0,
      WALL = 1,
      START = 2,
      GOAL = 3,
      INQ = 4,
      VISITED = 5,
      PATH = 6;

class ShortestPath extends Animation {
    constructor (canvas, colors, colorsAlt,
                 cellSize = 12,
                 searchAlgorithm = "A*", // or "BFS" or "random"
                 movementType = "random", // or "4-dir" or "8-dir"
                 speed = 1,
                 startNewAfterFinish = true,
                 cellStyle = "random", // or "sharp" or "rounded"
                 showStats = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.cellSize = cellSize;
        this.speed = speed;
        this.startNewAfterFinish = startNewAfterFinish;
        this.showStats = showStats;
        this.searchAlgorithms = ["BFS", "A*"];
        this.searchAlgorithm = this.assignIfRandom(searchAlgorithm, Utils.randomChoice(this.searchAlgorithms));
        this.movementTypes = ["4-dir", "8-dir"];
        this.movementType = this.assignIfRandom(movementType, Utils.randomChoice(this.movementTypes));
        this.cellStyles = ["sharp", "rounded"];
        this.cellStyle = this.assignIfRandom(cellStyle, Utils.randomChoice(this.cellStyles));

        this.updateName();
        this.queue = null;
        this.visited = 0;

        this.mapWidth = 0;
        this.mapHeight = 0;
        this.map = null;
        this.dist = null;
        this.prev = null;

        this.pathLenght = 0;
    }

    updateName(){
        this.name = `finding the shortest path using ${this.searchAlgorithm} algorithm`;
    }

    getIdx(x, y){
        return x + y * this.mapWidth;
    }

    getXY(idx){
        return Utils.createVec2d(idx % this.mapWidth, Math.floor(idx / this.mapWidth));
    }

    isWall(x, y){
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return true;
        else return (this.map[this.getIdx(x, y)] === WALL);
    }

    minDistance(nodePos1, nodePos2){
        const xDist = Math.abs(nodePos1.x - nodePos2.x),
              yDist = Math.abs(nodePos1.y - nodePos2.y);
        if(this.movementType === "4-dir") return xDist + yDist; // Manhattan distance
        else if(this.movementType === "8-dir"){
            const diagDist = Math.min(xDist, yDist);
            return diagDist * Math.sqrt(2) + xDist + yDist - 2 * diagDist;
        }
        else return 0;
    }

    // Function with the main logic, that expand the next node
    expandNextNode(){
        const item = this.queue.pop();
        if(item === null) return;

        ++this.visited;
        const idx = item.key,
              pos = this.getXY(idx),
              mapVal = this.map[idx];
        this.pathLenght = Math.max(this.pathLenght, this.dist[idx]);

        let nextIdxs = [];
        if(this.movementType === "4-dir") {
            nextIdxs = [this.getIdx(pos.x - 1, pos.y),
                        this.getIdx(pos.x, pos.y - 1),
                        this.getIdx(pos.x + 1, pos.y),
                        this.getIdx(pos.x, pos.y + 1)];
        }

        if(this.movementType === "8-dir"){
            nextIdxs = [this.getIdx(pos.x - 1, pos.y),
                        this.getIdx(pos.x - 1, pos.y - 1),
                        this.getIdx(pos.x, pos.y - 1),
                        this.getIdx(pos.x + 1, pos.y - 1),
                        this.getIdx(pos.x + 1, pos.y),
                        this.getIdx(pos.x + 1, pos.y + 1),
                        this.getIdx(pos.x, pos.y + 1),
                        this.getIdx(pos.x - 1, pos.y + 1)];
        }

        if(mapVal !== START && mapVal !== GOAL) this.map[idx] = VISITED;
        else if(mapVal === GOAL){
            let pathIdx = this.prev[idx];
            while(this.prev[pathIdx] >= 0) {
                this.map[pathIdx] = PATH;
                pathIdx = this.prev[pathIdx]
            }
            this.pathLenght = this.dist[idx];
            this.queue.clear();
            return;
        }

        for(let nextIdx of nextIdxs){
            const nextMapVal = this.map[nextIdx],
                  nodePos = this.getXY(nextIdx),
                  nodeDist = this.dist[idx] + this.minDistance(pos, nodePos);

            if(nextMapVal !== WALL && nodeDist < this.dist[nextIdx]){
                if(this.searchAlgorithm === "BFS") this.queue.push({key: nextIdx, value: nodeDist});
                else if(this.searchAlgorithm === "A*"){
                    const goalPos = this.getXY(this.goalIdx),
                          minDist = this.minDistance(nodePos, goalPos);
                    this.queue.push({key: nextIdx, value: nodeDist + minDist});
                }
                if(nextMapVal !== GOAL) this.map[nextIdx] = INQ;
                this.dist[nextIdx] = nodeDist;
                this.prev[nextIdx] = idx;
            }
        }
    }

    update(elapsed) {
        for (let i = 0; i < this.speed; ++i){
            this.expandNextNode();
            ++this.frame;
        }

        if (this.startNewAfterFinish && this.frame >= (this.visited + 300)) this.resize();
    }

    // Drawing functions
    drawWallCell(x, y, cellPadding){
        if(this.cellStyle === "sharp"){
            let paddingLeft = this.isWall(x - 1, y) ? 0 : cellPadding,
                paddingRight = this.isWall(x + 1, y) ? 0 : cellPadding,
                paddingTop = this.isWall(x, y - 1) ? 0 : cellPadding,
                paddingBottom = this.isWall(x, y + 1) ? 0 : cellPadding;

            this.ctx.fillRect(x * this.cellSize + paddingLeft, y * this.cellSize + paddingTop,
                this.cellSize - paddingLeft - paddingRight, this.cellSize - paddingTop - paddingBottom);
        }
        else if(this.cellStyle === "rounded") {
            this.ctx.beginPath();
            this.ctx.arc(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - cellPadding, 0, 2 * Math.PI, false);
            this.ctx.fill();

            const hCellSize = this.cellSize / 2,
                  drawX = x * this.cellSize,
                  drawY = y * this.cellSize,
                  drawCenterX = (x + 0.5) * this.cellSize,
                  drawCenterY = (y + 0.5) * this.cellSize,
                  drawEndX = (x + 1) * this.cellSize,
                  drawEndY = (y + 1) * this.cellSize;

            if (this.isWall(x - 1, y)) this.ctx.fillRect(drawX, drawY + cellPadding, hCellSize, this.cellSize - 2 * cellPadding);
            if (this.isWall(x + 1, y)) this.ctx.fillRect(drawCenterX, drawY + cellPadding, hCellSize, this.cellSize - 2 * cellPadding);
            if (this.isWall(x, y - 1)) this.ctx.fillRect(drawX + cellPadding, drawY, this.cellSize - 2 * cellPadding, hCellSize);
            if (this.isWall(x, y + 1)) this.ctx.fillRect(drawX + cellPadding, drawCenterY, this.cellSize - 2 * cellPadding, hCellSize);

            if (this.isWall(x - 1, y) && this.isWall(x, y - 1)) {
                this.ctx.beginPath();
                if(this.isWall(x - 1, y - 1)) this.ctx.rect(drawX, drawY, cellPadding, cellPadding);
                else {
                    this.ctx.arc(drawX, drawY, cellPadding, 0, Math.PI / 2, false);
                    this.ctx.lineTo(drawX + cellPadding, drawY + cellPadding);
                    this.ctx.lineTo(drawX + cellPadding, drawY);
                }
                this.ctx.fill();
            }

            if (this.isWall(x - 1, y) && this.isWall(x, y + 1)) {
                this.ctx.beginPath();
                if(this.isWall(x - 1, y + 1)) this.ctx.rect(drawX, drawEndY - cellPadding, cellPadding, cellPadding);
                else {
                    this.ctx.arc(drawX, drawEndY, cellPadding, Math.PI * 1.5, 0, false);
                    this.ctx.lineTo(drawX + cellPadding, drawEndY - cellPadding);
                    this.ctx.lineTo(drawX, drawEndY - cellPadding);
                }
                this.ctx.fill();
            }

            if (this.isWall(x + 1, y) && this.isWall(x, y - 1)) {
                this.ctx.beginPath();
                if(this.isWall(x + 1, y - 1)) this.ctx.rect(drawEndX - cellPadding, drawY, cellPadding, cellPadding);
                else {
                    this.ctx.arc(drawEndX, drawY, cellPadding, Math.PI / 2, Math.PI, false);
                    this.ctx.lineTo(drawEndX - cellPadding, drawY + cellPadding);
                    this.ctx.lineTo(drawEndX, drawY + cellPadding);
                }
                this.ctx.fill();
            }

            if (this.isWall(x + 1, y) && this.isWall(x, y + 1)) {
                this.ctx.beginPath();
                if(this.isWall(x + 1, y + 1)) this.ctx.rect(drawEndX - cellPadding, drawEndY - cellPadding, cellPadding, cellPadding);
                else {
                    this.ctx.arc(drawEndX, drawEndY, cellPadding, Math.PI, Math.PI * 1.5, false);
                    this.ctx.lineTo(drawEndX - cellPadding, drawEndY - cellPadding);
                    this.ctx.lineTo(drawEndX - cellPadding, drawEndY);
                }
                this.ctx.fill();
            }
        }
    }

    drawNodeCell(x, y, cellPadding){
        if(this.cellStyle === "sharp"){
            this.ctx.fillRect(x * this.cellSize + cellPadding, y * this.cellSize + cellPadding,
                this.cellSize - 2 * cellPadding, this.cellSize - 2 * cellPadding);
        }
        else if(this.cellStyle === "rounded") {
            this.ctx.beginPath();
            this.ctx.arc(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - cellPadding, 0, 2 * Math.PI, false);
            this.ctx.fill();
        }

        if(this.debug){
            this.ctx.fillStyle = "black";
            const goalPos = this.getXY(this.goalIdx),
                  minDist = Utils.round(this.minDistance({x: x, y: y}, goalPos), 1),
                  dist = Utils.round(this.dist[this.getIdx(x, y)], 1);
            this.ctx.fillText(`${dist}+${minDist}`, x * this.cellSize, y * this.cellSize);
            this.ctx.fillText( `=${Utils.round(dist + minDist)}`, x * this.cellSize, y * this.cellSize + 20);
        }
    }

    drawNodeConnection(idx){
        const pos = this.getXY(idx),
              prevPos = this.getXY(this.prev[idx]);
        this.ctx.beginPath();
        this.ctx.moveTo((pos.x + 0.5) * this.cellSize, (pos.y + 0.5) * this.cellSize);
        this.ctx.lineTo((prevPos.x + 0.5) * this.cellSize, (prevPos.y + 0.5) * this.cellSize);
        this.ctx.stroke();
    }

    draw() {
        this.clear();

        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                const idx = this.getIdx(x, y),
                      mapVal = this.map[idx];

                if([INQ, VISITED, PATH, GOAL].indexOf(mapVal) >= 0 && this.prev[idx] >= 0) {
                    if(mapVal === INQ) this.ctx.strokeStyle = this.colors[2];
                    else if(mapVal === VISITED) this.ctx.strokeStyle = this.colors[1];
                    else if(mapVal === PATH || mapVal === GOAL) this.ctx.strokeStyle = this.colorsAlt[2];
                    this.drawNodeConnection(idx);
                }
            }
        }

        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                const idx = this.getIdx(x, y),
                      mapVal = this.map[idx];

                if(mapVal === WALL){
                    this.ctx.fillStyle = this.colors[0];
                    this.drawWallCell(x, y, this.cellSize / 6);
                } else if(mapVal === START) {
                    this.ctx.fillStyle = this.colorsAlt[0];
                    this.drawNodeCell(x, y, 1);
                } else if(mapVal === GOAL) {
                    this.ctx.fillStyle = this.colorsAlt[1];
                    this.drawNodeCell(x, y, 1);
                } else if(mapVal === INQ) {
                    this.ctx.fillStyle = this.colors[2];
                    this.drawNodeCell(x, y, this.cellSize / 3);
                } else if(mapVal === VISITED) {
                    this.ctx.fillStyle = this.colors[1];
                    this.drawNodeCell(x, y, this.cellSize / 4);
                } else if(mapVal === PATH) {
                    this.ctx.fillStyle = this.colorsAlt[2];
                    this.drawNodeCell(x, y, this.cellSize / 6);
                }
            }
        }

        if(this.showStats){
            const lineHeight = 20;
            this.ctx.font = '14px sans-serif';
            this.ctx.lineWidth = 2;
            this.ctx.fillStyle = this.colors[0];
            this.ctx.strokeStyle = this.bgColor;

            Utils.fillAndStrokeText(this.ctx, `Search algorithm: ${this.searchAlgorithm}`, lineHeight, this.ctx.canvas.height - 3 * lineHeight);
            Utils.fillAndStrokeText(this.ctx, `Number of visited nodes: ${this.visited}`, lineHeight, this.ctx.canvas.height - 2 * lineHeight);
            let pathText = this.queue.size === 0 ? 'Shortest path length: ' : 'Longest traveled path: ';
            pathText += Utils.round(this.pathLenght);
            Utils.fillAndStrokeText(this.ctx, pathText, lineHeight, this.ctx.canvas.height - lineHeight);
        }
    }

    recursiveMaze(mazeX, mazeY, mazeW, mazeH){
        const minSize = 9,
              wallsMinDist = Math.floor(minSize / 3),
              wallSpawnProb = 1.0 - mazeW / this.mapWidth;

        const mazeEndX = mazeX + mazeW,
              mazeEndY = mazeY + mazeH;

        const wall1 = mazeW >= minSize && Math.random() > (wallSpawnProb * mazeH / mazeW),
              wall2 = mazeH >= minSize && Math.random() > wallSpawnProb;

        // let wallX = wall1 ? mazeX + Math.floor(mazeW / 2) : mazeX - 1,
        //     wallY = wall2 ? mazeY + Math.floor(mazeH / 2) : mazeEndY;

        let wallX, wallY;

        if(wall1) {
            do wallX = mazeX + Utils.randomInt(wallsMinDist, mazeW - wallsMinDist);
            while (this.map[this.getIdx(wallX, mazeY - 1)] !== WALL || this.map[this.getIdx(wallX, mazeEndY) !== WALL]);
        } else wallX = mazeX - 1;

        if(wall2) {
            do wallY = mazeY + Utils.randomInt(wallsMinDist, mazeH - wallsMinDist);
            while(this.map[this.getIdx(mazeX - 1, wallY)] !== WALL || this.map[this.getIdx(mazeEndX, wallY)] !== WALL);
        } else wallY = mazeEndY;

        if(wall1) {
            for (let y = 0; y < mazeH; ++y) this.map[this.getIdx(wallX, mazeY + y)] = WALL;
            this.map[this.getIdx(wallX, Utils.randomInt(mazeY, wallY))] = EMPTY;
            if(wall2) this.map[this.getIdx(wallX, Utils.randomInt(wallY + 1, mazeEndY))] = EMPTY;

            this.recursiveMaze(mazeX, mazeY, wallX - mazeX, wallY - mazeY);
            this.recursiveMaze(wallX + 1, mazeY, mazeEndX - wallX - 1, wallY - mazeY);
        }
        if(wall2){
            for (let x = 0; x < mazeW; ++x) this.map[this.getIdx(mazeX + x, wallY)] = WALL;
            if(wall1) this.map[this.getIdx(Utils.randomInt(mazeX, wallX), wallY)] = EMPTY;
            this.map[this.getIdx(Utils.randomInt(wallX + 1, mazeEndX), wallY)] = EMPTY;

            this.recursiveMaze(mazeX, wallY + 1, wallX - mazeX, mazeEndY - wallY - 1);
            this.recursiveMaze(wallX + 1, wallY + 1, mazeEndX - wallX - 1, mazeEndY - wallY - 1);
        }
    }

    resize() {
        this.mapWidth = Math.ceil(this.ctx.canvas.width / this.cellSize);
        this.mapHeight = Math.ceil(this.ctx.canvas.height / this.cellSize);
        this.mapSize = this.mapWidth * this.mapHeight;
        this.map = new Array(this.mapSize);
        this.dist = new Array(this.mapSize);
        this.prev = new Array(this.mapSize);

        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                const idx = this.getIdx(x, y);
                if(x === 0 || x === (this.mapWidth - 1) || y === 0 || y === (this.mapHeight - 1)) this.map[idx] = WALL;
                else this.map[idx] = EMPTY;
                this.dist[idx] = 999999;
                this.prev[idx] = -1;
            }
        }

        this.recursiveMaze(1, 1, this.mapWidth - 2, this.mapHeight - 2);
        this.startIdx = 0;
        this.goalIdx = 0;
        while(this.map[this.startIdx] === WALL)
            this.startIdx = this.getIdx(Utils.randomInt(1, this.mapWidth - 1), Utils.randomInt(1, this.mapHeight - 1));
        while(this.map[this.goalIdx] === WALL)
            this.goalIdx = this.getIdx(Utils.randomInt(1, this.mapWidth - 1), Utils.randomInt(1, this.mapHeight - 1));

        this.restart();
        this.updateName();
    }

    restart(){
        this.frame = 0;
        this.visited = 0;
        this.pathLenght = 0;

        for (let y = 0; y < this.mapHeight; ++y) {
            for (let x = 0; x < this.mapWidth; ++x) {
                const idx = this.getIdx(x, y),
                      mapVal = this.map[idx];
                if(mapVal !== WALL){
                    this.map[idx] = EMPTY;
                    this.dist[idx] = 999999;
                    this.prev[idx] = -1;
                }
            }
        }

        this.map[this.startIdx] = START;
        this.dist[this.startIdx] = 0;
        this.map[this.goalIdx] = GOAL;
        this.priorityQueue = this.searchAlgorithm === "A*";
        this.queue = new Queue(this.mapSize, this.priorityQueue);
        this.queue.push({key: this.startIdx, value: 0});
    }

    getSettings() {
        return [{prop: "searchAlgorithm", type: "select", values: this.searchAlgorithms, toCall: "restart"},
                {prop: "movementType", type: "select", values: this.movementTypes, toCall: "restart"},
                {prop: "cellSize", type: "int", min: 8, max: 48, toCall: "resize"},
                {prop: "speed", type: "int", min: 1, max: 64},
                {prop: "startNewAfterFinish", type: "bool"},
                {prop: "cellStyle", type: "select", values: this.cellStyles},
                {prop: "showStats", type: "bool"}];
    }
}

module.exports = ShortestPath;
