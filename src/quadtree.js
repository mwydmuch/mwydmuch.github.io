'use strict';

const NAME = "quadtree visualization",
      FILE = "quadtree.js",
      DESC = `
Visualization of quadtree algorithm.
See: https://en.wikipedia.org/wiki/Quadtree

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");
const Noise = require("./noise");

class Quadtree extends Animation {
    constructor(canvas, colors, colorsAlt,
                maxPointsInNode = 1,
                pointsDensity = 9,
                drawPoints = false,
                noiseScale = 0.001) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);
        this.pointsDensity = pointsDensity;

        this.noiseScale = noiseScale;
        this.noise = Noise.noise;
        this.noise.seed(Utils.randomRange(0, 1));
        
        this.width = 0;
        this.height = 0;

        this.drawPoints = drawPoints;
        this.maxPointsInNode = maxPointsInNode;
    }

    generatePoints(){
        let points = [];
        const maxRectSize = Math.max(this.width, this.height),
              spacing = maxRectSize / Math.pow(2, this.pointsDensity),
              spacingHalf = spacing / 2,
              noiseThr = spacing / maxRectSize;
        for(let x = -spacing / 2; x < this.width; x += spacing){
            for (let y = -spacing / 2; y < this.height; y += spacing){
                const noiseVal = this.noise.perlin3(x * this.noiseScale, y * this.noiseScale, this.time * 0.05);
                if(Math.abs(noiseVal) <= noiseThr){
                    points.push({
                        x: Utils.randomRange(x - spacingHalf, x + spacingHalf),
                        y: Utils.randomRange(y - spacingHalf, y + spacingHalf)
                    });
                }
            }
        }
        return points;
    }

    quadTree(x, y, size, points){
        const sizeHalf = size / 2,
              sizeQuar = size / 4;
        if (points.length <= this.maxPointsInNode) {
            this.ctx.strokeRect(x - sizeHalf, y - sizeHalf, size, size);
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
            this.quadTree(x + sizeQuar, y + sizeQuar, sizeHalf, nePoints);
            this.quadTree(x + sizeQuar, y - sizeQuar, sizeHalf, sePoints);
            this.quadTree(x - sizeQuar, y + sizeQuar, sizeHalf, nwPoints);
            this.quadTree(x - sizeQuar, y - sizeQuar, sizeHalf, swPoints);
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
        this.quadTree(this.width / 2, this.height / 2, maxRectSize, points);

        if(this.drawPoints)
            for(let p of points) Utils.fillCircle(this.ctx, p.x, p.y, 2, this.colorsAlt[1]);
    }


    getSettings() {
        return [{prop: "maxPointsInNode", type: "int", min: 1, max: 16},
                {prop: "noiseScale", type: "float", step: 0.0001, min: 0.0005, max: 0.0015},
                {prop: "pointsDensity", type: "int", min: 1, max: 10},
                {prop: "drawPoints", type: "bool"}];
    }
}

module.exports = Quadtree;
