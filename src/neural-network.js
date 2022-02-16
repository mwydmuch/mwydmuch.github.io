/*
 * Visualization of a simple, fully connected neural network, with random weights,
 * ReLU activations on intermediate layers, and sigmoid output at the last layer.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class NeuralNetwork extends Animation {
    constructor(canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "visualization of simple neural network", "neural-network.js");
        this.network = [];
        this.nLayers = 0;

        this.baseNodeSize = 3;
        this.baseLineSize = 1;
    }

    getFPS(){
        return 1.5; // Override default framerate
    }

    update(timeElapsed){
        // Update network values

        // Randomly
        // for (let l of this.network) {
        //     for (let n of l) n.v = Math.random();
        // }

        // Calculate values based on weights
        if(this.network.length == 0) return;
        for (let n of this.network[0]) n.v = Utils.randomRange(-1, 1);
        for (let i = 1; i < this.nLayers; i++) {
            for (let n of this.network[i]) {
                n.v = 0;
                for (let j = 0; j < this.network[i - 1].length; ++j) {
                    n.v += this.network[i - 1][j].v * n.w[j];
                }
                if(i == this.nLayers - 1) n.v = 1 / (1 + Math.exp(-n.v)); // Sigmoid for last layer
                else n.v = Math.max(0, n.v); // ReLU
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
                    const v = Utils.clip(n1.v, 0, 1);
                    const color = this.colors[this.colors.length - 1 - Math.floor(v * this.colors.length)];
                    this.ctx.globalAlpha = v;
                    Utils.drawLine(this.ctx, n1.x, n1.y, n2.x, n2.y, color, 1 + v);
                }
            }
        }

        // Draw nodes
        this.ctx.globalAlpha = 1.0;
        for (let l of this.network) {
            for (let n of l) {
                let v = Utils.clip(n.v, 0, 1);
                let v2 = Utils.clip(n.v * 2, 0, 4);
                let color = this.colors[this.colors.length - 1 - Math.floor(v * this.colors.length)];
                let nSize = this.baseNodeSize + v2;
                Utils.fillCircle(this.ctx, n.x, n.y, nSize, color);
                this.ctx.font = '12px sans-serif';
                this.ctx.fillText(n.v.toFixed(2), n.x - 11, n.y - 2 * this.baseNodeSize);
            }
        }
    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");

        // Create new network that will nicely fit to the entire page
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;

        this.network = [];

        // Number of layers depends on screen width
        this.nLayers = Utils.clip(Math.floor(width / 150), 3, 7);
        const margin = 50 * width / 500;
        const interLayer = (width - 2 * margin) / (this.nLayers - 1);
        const interNode = height / 17;

        let x = margin;
        for (let i = 0; i < this.nLayers; i++) {
            let layer = [];
            let layerNodes = 0;
            if(i == 0 || i == this.nLayers - 1) layerNodes = Math.floor(Utils.randomRange(4, 16));
            else layerNodes = Utils.randomChoice([8, 12, 16]);
            let y = height / 2 - Math.floor(layerNodes / 2) * interNode;
            if (layerNodes % 2 == 0) y += interNode/2;

            for (let j = 0; j < layerNodes; j++) {
                let n = {x: x, y: y, v: 0, w: null};
                if(i > 0) n.w = Utils.randomArray(this.network[i - 1].length, -1, 1);
                layer.push(n);
                y += interNode;
            }
            this.network.push(layer);
            x += interLayer;
        }

        this.update(0);
        this.draw();
    }
}

module.exports = NeuralNetwork;
