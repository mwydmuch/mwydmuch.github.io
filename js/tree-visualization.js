'use strict';

/*
Work in progress.

Tree visualization algorithms:
- the Reingold–Tilford algorithm,
- the root-centric radial layout algorithm
- the parent-centric
- PLANET a radial layout algorithm 
(https://homexinlu.com/files/PLANETA%20radial%20layout%20algorithm%20for%20network%20visualization.pdf)
*/


const NAME = "tree visualization",
      FILE = "tree-vizualization.js",
      DESC = `
Visualization of the tree using different algorithms.

Coded with no external dependencies, using only canvas API.
`;


const Animation = require("./animation");
const Utils = require("./utils");

class TreeVisualization extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor, 
                maxDepth = 4, 
                minChildren = 2,
                maxChildren = 6, 
                radius = 30,
                treeAlgorithm = "random") {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.maxDepth = maxDepth;
        this.maxChildren = maxChildren;
        this.minChildren = minChildren;
        this.radius = radius;

        this.treeAlgoNames = ["proportional space", "equal space"];
        this.treeAlgorithm = this.assignIfRandom(treeAlgorithm, Utils.randomChoice(this.treeAlgoNames));

        this.nodes = [];
        this.treeRoot = null;
        this.restart();
    }

    calNodesXY(){

    }

    proportionalSpace(){
        this.treeRoot.theta = 90;
        let d = 0,
            levelNodes = [[this.treeRoot]];

        while(levelNodes[d].length > 0){
            let nextLevelNodes = [];
            for(let i = 0; i < levelNodes[d].length; ++i){
                let n = levelNodes[d][i];
                for(let j = 0; j < n.children.length; ++j){
                    let c = n.children[j];
                    c.theta = n.theta - 180 / n.parentsChildren + (j + 0.5) * 360 / n.children.length / n.parentsChildren;
                    c.parentsChildren = n.parentsChildren * n.children.length;
                    nextLevelNodes.push(c);
                }
            }
            ++d;
            levelNodes.push(nextLevelNodes);
        }
        for(let n of this.nodes){
            n.x = n.depth * this.radius * Math.cos(n.theta * Math.PI / 180);
            n.y = n.depth * this.radius * Math.sin(n.theta * Math.PI / 180);
        }
    }

    equalSpace(){
        this.treeRoot.theta = 90;
        let d = 0,
            levelNodes = [[this.treeRoot]];

        while(levelNodes[d].length > 0){
            let nextLevelNodes = [],
                bestR = 0,
                bestAvgDist = 360*360,
                avgDist = bestAvgDist - 1;
            for(let i = 0; i < levelNodes[d].length; ++i) nextLevelNodes.push(...levelNodes[d][i].children);
            if(nextLevelNodes.length == 0) break;

            for(let i = 0; i < nextLevelNodes.length; ++i){
                let c = nextLevelNodes[i];
                c.theta = i * 360 / nextLevelNodes.length;
            }

            for(let r = 0; r < 360; ++r){
                avgDist = 0;
                for(let n of levelNodes[d]){
                    let maxDist = 0;
                    for(let c of n.children){
                        let dist = Math.abs(c.theta + r - c.parent.theta);
                        dist = dist % 360;
                        if(dist > 180) dist = 360 - dist;
                        maxDist = Math.max(maxDist, dist);
                    }
                    maxDist *= maxDist;
                    avgDist += maxDist;
                }
                avgDist /= levelNodes[d].length;
                if(avgDist < bestAvgDist){
                    bestAvgDist = avgDist;
                    bestR = r;
                }
            }
            for(let c of nextLevelNodes) c.theta += bestR;

            ++d;
            levelNodes.push(nextLevelNodes);
        }
        for(let n of this.nodes){
            n.x = n.depth * this.radius * Math.cos(n.theta * Math.PI / 180);
            n.y = n.depth * this.radius * Math.sin(n.theta * Math.PI / 180);
        }
    }

    plante(){
        let d = 0,
            levelNodes = [[this.treeRoot]];
        
        while(levelNodes[d].length > 0){
            let nextLevelNodes = [];
            for(let i = 0; i < levelNodes[d].length; ++i){
                let n = levelNodes[d][i],
                    m = 1,
                    p = n;
                
                while(p.parent != null){
                    p = p.parent;
                    m *= p.children.length;
                }

                for(let j = 0; j < n.children.length; ++j){
                    let c = n.children[j],
                        base = j * 360 / (n.children.length - 1) / m;
                    if(d == 0) base = j * 360 / n.children.length / m;
                    if(n.children.length == 1) c.theta = n.theta;
                    else if(d < 2) c.theta = n.theta - 180 / m + base;
                    else {
                        console.log(j, m, n.theta, base);
                        if(n.children.length == 1) c.theta = n.theta;
                        else if (n.theta < n.parent.theta) c.theta = n.theta + base;
                        else if (n.theta > n.parent.theta) c.theta = n.theta - base;
                        else c.theta = n.theta - 180 / m + base;
                    }
                    c.x = n.x + this.radius * Math.cos(c.theta * Math.PI / 180);
                    c.y = n.y + this.radius * Math.sin(c.theta * Math.PI / 180);
                    nextLevelNodes.push(c);
                }
            }
            ++d;
            levelNodes.push(nextLevelNodes);
        }
    }

    restart(){
        this.nodes = [];
        this.treeRoot = this.genNode(null, 0);
        if(this.treeAlgorithm == "equal space") this.equalSpace();
        else if(this.treeAlgorithm == "proportional space") this.proportionalSpace();
        //for(let n of this.nodes) console.log(n);
    }

    genNode(parent, depth){
        let node = {
            parent: parent,
            children: [],
            x: 0,
            y: 0,
            theta: 0,
            depth: depth,
            parentsChildren: 1
        }
        this.nodes.push(node);
        if(depth < this.maxDepth){
            let children = Utils.randomInt(this.minChildren, this.maxChildren);
            for(let i = 0; i < children; ++i) node.children.push(this.genNode(node, depth + 1));
        }
        return node;
    }

    draw() {
        this.clear();
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        for(let n of this.nodes){
            for(let c of n.children) Utils.drawLine(this.ctx, n.x, n.y, c.x, c.y, 1, "#000");
            Utils.fillCircle(this.ctx, n.x, n.y, 5, this.colors[n.depth]);
        }
        this.ctx.resetTransform();
    }

    getSettings() {
        return [{prop: "maxDepth", type: "int", min: 1, max: 6, toCall: "restart"},
                {prop: "minChildren", type: "int", min: 0, max: 8, toCall: "restart"},
                {prop: "maxChildren", type: "int", min: 1, max: 8, toCall: "restart"},
                {prop: "radius", type: "int", min: 10, max: 300, toCall: "restart"},
                {prop: "treeAlgorithm", type: "select", values: this.treeAlgoNames, toCall: "restart"}];
    }
}

module.exports = TreeVisualization;
