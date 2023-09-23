'use strict';

const NAME = "quadtree visualization",
      FILE = "quadtree.js",
      DESC = `
Visualization of quadtree for points generated by thresholding Perlin noise.
Quadtree is a data structure that is 2-dimensional, special variant of k-d trees.

You can read about quadtree on [Wikipedia](https://en.wikipedia.org/wiki/Quadtree).

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class Quadtree extends Animation {
    constructor(canvas, colors, colorsAlt,
                maxPointsInNode = 1,
                pointsDensity = 0.4,
                drawPoints = false,
                noiseScale = 0.002,
                noiseSpeed = {x: "random", y: "random", z: 1},
                noiseThreshold = 0.01,
                drawLeafNode = true) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.pointsDensity = pointsDensity;
        this.drawPoints = drawPoints;
        this.maxPointsInNode = maxPointsInNode;
        this.noiseThreshold = noiseThreshold;
        this.drawLeafNodes = drawLeafNode;
        
        this.noiseScale = noiseScale;
        this.noiseSpeed = noiseSpeed;
        this.noiseSpeed.x = this.assignIfRandom(this.noiseSpeed.x, Utils.round(Utils.randomRange(-1, 1), 1));
        this.noiseSpeed.y = this.assignIfRandom(this.noiseSpeed.y, Utils.round(Utils.randomRange(-1, 1), 1));
        
        this.minNodeSize = 4;
        
        this.width = 0;
        this.height = 0;
        this.noisePos = {x: 0, y: 0, z: 0};
    }

    update(elapsed){
        this.noisePos.x += this.noiseSpeed.x * elapsed / 1000 * 10;
        this.noisePos.y += this.noiseSpeed.y * elapsed / 1000 * 10;
        this.noisePos.z += this.noiseSpeed.z * elapsed / 1000 * 0.05;
        super.update(elapsed);
    }

    generatePoints(){
        let points = [];
        const spacing = 1 / this.pointsDensity,
              spacingHalf = spacing / 2;
        let rng = Utils.Mulberry32(this.seed);
        for(let x = spacingHalf; x < this.width; x += spacing){
            for (let y = spacingHalf; y < this.height; y += spacing){
                const noiseVal = this.noise.perlin3(
                    (x + this.noisePos.x) * this.noiseScale, 
                    (y + this.noisePos.y) * this.noiseScale, 
                    this.noisePos.z);
                if(Math.abs(noiseVal) <= this.noiseThreshold){
                    // To make it look more natural add some small random offset to the point's position
                    points.push({
                        x: x - spacingHalf + rng() * spacing,
                        y: y - spacingHalf + rng() * spacing,
                    });
                }
            }
        }
        return points;
    }

    quadTree(x, y, size, points, depth){
        const sizeHalf = size / 2,
              sizeQuar = size / 4;
        if (points.length <= this.maxPointsInNode || size <= this.minNodeSize) {
            if(size > this.minNodeSize || this.drawLeafNodes) this.ctx.strokeRect(x - sizeHalf, y - sizeHalf, size, size);
        } else {
            let nwPoints = [],
                nePoints = [],
                swPoints = [],
                sePoints = [];
            for(let p of points){
                if(p.x < x && p.y >= y) nwPoints.push(p);
                else if(p.x >= x && p.y >= y) nePoints.push(p);
                else if(p.x >= x && p.y < y) sePoints.push(p);
                else if(p.x < x && p.y < y) swPoints.push(p);
            }
            ++depth;
            this.quadTree(x + sizeQuar, y + sizeQuar, sizeHalf, nePoints, depth);
            this.quadTree(x + sizeQuar, y - sizeQuar, sizeHalf, sePoints, depth);
            this.quadTree(x - sizeQuar, y + sizeQuar, sizeHalf, nwPoints, depth);
            this.quadTree(x - sizeQuar, y - sizeQuar, sizeHalf, swPoints, depth);
        }
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        this.width = this.ctx.canvas.width,
        this.height = this.ctx.canvas.height;

        let maxRectSize = Math.max(this.width, this.height),
            points = this.generatePoints();

        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors[0];
        this.quadTree(this.width / 2, this.height / 2, maxRectSize, points, 0);

        if(this.drawPoints){
            this.ctx.fillStyle = this.colorsAlt[1];
            if(this.pointsDensity < 0.5)
                for(let p of points) Utils.fillCircle(this.ctx, p.x, p.y, 2, this.colorsAlt[1]);
            else
                for(let p of points) this.ctx.fillRect(p.x, p.y, 2, 2);
        }
    }

    restart(){
        this.noisePos = {x: 0, y: 0, z: 0};
        super.restart();
    }

    getSettings() {
        return [{prop: "maxPointsInNode", type: "int", min: 1, max: 16},
                {prop: "pointsDensity", type: "float", step: 0.1, min: 0.1, max: 0.7},
                {prop: "noiseScale", type: "float", step: 0.0001, min: 0.0005, max: 0.0125},
                {prop: "noiseSpeed.x", type: "float", step: 0.1, min: -10, max: 10},
                {prop: "noiseSpeed.y", type: "float", step: 0.1, min: -10, max: 10},
                {prop: "noiseSpeed.z", type: "float", step: 0.1, min: -10, max: 10},
                {prop: "noiseThreshold", type: "float", min: 0, max: 0.15, step: 0.001},
                //{prop: "minNodeSize", type: "float", step: 0.1, min: 1, max: 6},
                {prop: "drawLeafNodes", type: "bool"},
                {prop: "drawPoints", type: "bool"},
                this.getSeedSettings()];
    }
}

module.exports = Quadtree;
