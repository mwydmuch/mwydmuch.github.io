'use strict';

const Animation = require("./animation");
const Utils = require("./utils");

class NeuralNetwork extends Animation {
    constructor(canvas, colors) {
        super(canvas, colors);
        this.network = [];
        this.nLayers = 0;
        this.resize();

        this.baseNodeSize = 3;
        this.baseLineSize = 1;
    }

    getFPS(){
        return 2;
    }

    getName(){
        return "visualization of simple neural network"
    }

    update(elapsed){
        // Update network values

        // Randomly
        // for (let l of this.network) {
        //     for (let n of l) n.v = Math.random();
        // }

        // Calculate values based on weights
        if(this.network.length == 0) return;
        for (let n of this.network[0]) n.v = Math.random();
        for (let i = 1; i < this.nLayers; i++) {
            for (let n of this.network[i]) {
                n.v = 0;
                for (let j = 0; j < this.network[i - 1].length; ++j) {
                    n.v += this.network[i - 1][j].v * n.w[j];
                }
                n.v = 1 / (1 + Math.exp(-n.v));
            }
        }
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        // Draw connections
        for (let i = 0; i < this.nLayers - 1; i++) {
            let l1 = this.network[i];
            let l2 = this.network[i + 1];
            for (let n1 of l1) {
                for (let n2 of l2) {
                    let color = this.colors[this.colors.length - 1 - Math.floor(  n1.v * this.colors.length)];
                    this.ctx.globalAlpha = n1.v;
                    this.ctx.lineWidth = 1 + n1.v;
                    this.ctx.strokeStyle = color;
                    this.ctx.beginPath();
                    this.ctx.moveTo(n1.x, n1.y);
                    this.ctx.lineTo(n2.x, n2.y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw nodes
        this.ctx.globalAlpha = 1.0;
        for (let l of this.network) {
            for (let n of l) {
                let color = this.colors[this.colors.length - 1 - Math.floor(  n.v * this.colors.length)];
                let nSize = this.baseNodeSize + n.v * 2;
                Utils.fillCircle(this.ctx, color, n.x, n.y, nSize);
                this.ctx.font = '12px sans-serif';
                this.ctx.fillText(n.v.toFixed(2), n.x - 11, n.y - 2 * this.baseNodeSize);
            }
        }
    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");

        // Create new network that will nicely fit to the entire page
        this.network = [];
        this.nLayers = 5;
        let x = 150;
        let width = this.ctx.canvas.width;
        let height = this.ctx.canvas.height;
        let interLayer = width / this.nLayers;
        let interNode = height / 17;
        for (let i = 0; i < this.nLayers; i++) {
            let layer = [];
            let layerNodes = 0;
            if(i == 0 || i == this.nLayers - 1) layerNodes = Math.floor(Utils.randomRange(4, 16));
            else layerNodes = Utils.randomChoice([8, 12, 16]);
            let y = height / 2 - Math.floor(layerNodes / 2) * interNode;
            if (layerNodes % 2 == 0) {
                y += interNode/2;
            }

            for (let j = 0; j < layerNodes; j++) {
                let n = {x: x, y: y, v: 0, w: null};
                if(i > 0) n.w = Utils.randomArray(this.network[i - 1].length, -1, 1);
                layer.push(n);
                y += interNode;
            }
            this.network.push(layer);
            x += interLayer;
        }
    }
}

module.exports = NeuralNetwork;

