/*
 * Visualization of gradient descent-based optimizers.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");


// Optimizers
class Optim {
    constructor(w, name) {
        this.w = [...w];
        this.name = name;
    }

    update(grad){
        return 0;
    }

    getW(){
        return this.w;
    }

    getName(){
        return this.name;
    }
}

class SGD extends Optim {
    constructor (w) {
        super(w , "SGD");
        this.eta = 0.001;
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.w[i] -= this.eta * grad[i];
        }
    }
}

class Momentum extends Optim {
    constructor (w) {
        super(w, "Momentum");
        this.eta = 0.01;
        this.beta = 0.9;
        this.m = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta * this.m[i] + (1 - this.beta) * grad[i];
            this.w[i] -= this.eta * this.m[i];
        }
    }
}

class AdaGrad extends Optim {
    constructor (w) {
        super(w, "AdaGrad");
        this.eta = 0.1;
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.v[i] += grad[i] * grad[i];
            this.w[i] -= this.eta / Math.sqrt(this.v[i] + 0.000001) * grad[i];
        }
    }
}

class RMSProp extends Optim {
    constructor (w) {
        super(w, "RMSProp");
        this.eta = 0.01;
        this.beta = 0.9;
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.v[i] = this.beta * this.v[i] + (1 - this.beta) * grad[i] * grad[i];
            this.w[i] -= this.eta / Math.sqrt(this.v[i] + 0.000001) * grad[i];
        }
    }
}

class Adam extends Optim {
    constructor (w) {
        super(w, "Adam");
        this.eta = 0.01;
        this.beta1 = 0.9;
        this.beta2 = 0.999;
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * grad[i] * grad[i];
            this.w[i] -= this.eta / (Math.sqrt(this.v[i] / (1 - this.beta2)) + 0.000001) * this.m[i] / (1 - this.beta1);
        }
    }
}

class AdaMax extends Optim {
    constructor (w) {
        super(w, "AdaMax");
        this.alpha = 0.001;
        this.beta1 = 0.9;
        this.beta2 = 0.999;
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = Math.max(this.beta2 * this.v[i], Math.abs(grad[i]));
            this.w[i] -= this.alpha / (this.v[i] + 0.000001) * this.m[i] / (1 - this.beta1);
        }
    }
}

class AMSGrad extends Optim {
    constructor (w) {
        super(w, "AMSGrad");
        this.alpha = 0.001;
        this.beta1 = 0.9;
        this.beta2 = 0.999;
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = Math.max(this.beta2 * this.v[i] + (1 - this.beta2) * grad[i] * grad[i], this.v[i]);
            this.w[i] -= this.alpha / (Math.sqrt(this.v[i]) + 0.000001) * this.m[i];
        }
    }
}

// Benchmark functions
class Func {
    constructor(name, globalMin, startPoints, scale, shift=[0, 0], steps= 400) {
        this.name = name;
        this.globalMin = globalMin;
        this.startPoints = startPoints;
        this.scale = scale;
        this.steps = steps;
        this.shift = shift;
    }

    val(w) {
        return 0;
    }

    grad(w){
        return w;
    }

    hasGlobalMin(){
        return this.globalMin != null;
    }

    getGlobalMin(){
        return Utils.subArrays(this.globalMin, this.shift);
    }

    getStartPoint(){
        return Utils.subArrays(Utils.randomChoice(this.startPoints), this.shift);
    }

    getScale(){
        return this.scale;
    }

    getSteps(){
        return this.steps;
    }

    getName(){
        return this.name;
    }
}


class SaddlePointFunc extends Func {
    constructor() {
        super("Two-dimensional non-convex function with saddle point: f(x, y) = x^2 - y^2",
            null, [[-1, 0.001], [-1, -0.0001], [1, 0.01], [1, -0.001]], 1.1);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return x * x - y * y;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return [
            2 * x,
            -2 * y
        ]
    }
}


class BealeFunc extends Func{
    constructor() {
        super("Two-dimensional non-convex BEALE function",
            [3, 0.5], [[0.2, 0.7], [2, 2], [-1, -1.3], [-1.4, -1.7], [4, -1.1]], 2.2, [2, 0]);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return Math.pow(1.5 - x + x * y, 2) + Math.pow(2.25 - x + x * y * y, 2) + Math.pow(2.625 - x + x * Math.pow(y, 3), 2);
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            y2 = y * y,
            y3 = y2 * y,
            y4 = y3 * y,
            y5 = y4 * y,
            y6 = y5 * y;
        return [
            2 * x * (y6 + y4 - 2 * y3 - y2 - 2 * y + 3) + 5.25 * y3 + 4.5 * y2 + 3 * y - 12.75,
            6 * x * (x * (y5 + 2/3 * y3 - y2 - 1/3 * y - 1/3) + 2.625 * y2 + 1.5 * y + 0.5)
        ]
    }
}


class StyblinskiTangFunc extends Func{
    constructor() {
        super("Two variables non-convex Stybliski-Tang function",
            [-2.903534, -2.903534], [[0, 5], [0, -5], [5, 0], [-5, 0], [-0.5, -5], [-5, -0.5]], 5.5);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            x2 = x * x,
            x4 = x2 * x2,
            y2 = y * y,
            y4 = y2 * y2;
        return ((x4 - 16 * x2 + 5 * x) + (y4 - 16 * y2 + 5 * y)) / 2 + 78.33188;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            x3 = Math.pow(x, 3),
            y3 = Math.pow(y, 3);
        return [
            2 * x3 - 16 * x - 5 / 2,
            2 * y3 - 16 * y - 5 / 2
        ]
    }
}


class GradientDescent extends Animation {
    constructor (canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "visualization of gradient descent algorithms", "gradient-descent.js");
        this.funcClass = Utils.randomChoice([SaddlePointFunc, BealeFunc, StyblinskiTangFunc]);
        this.func = new this.funcClass();

        this.scale = 0;
        this.optims = null;
        this.imageData = null;
    }

    draw() {
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        for (let i = 0; i < this.optims.length; ++i) {
            let x1, y1, x2, y2;
            let o = this.optims[i];
            [x1, y1] = o.getW();
            o.update(this.func.grad(o.getW()));
            [x2, y2] = o.getW();
            Utils.drawLine(this.ctx, x1 * this.scale, -y1 * this.scale, x2 * this.scale, -y2 * this.scale, this.colorsAlt[i], 2);
        }

        this.ctx.resetTransform();

        if (this.frame >= this.func.getSteps()) this.resize();
    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");
        this.frame = 0;
        this.imageData = null;

        const width = this.ctx.canvas.width,
              height = this.ctx.canvas.height,
              centerX = width / 2,
              centerY = height / 2;
        this.scale = Math.min(width, height) / this.func.getScale() / 2;
        this.ctx.fillStyle = this.colors[0];
        this.ctx.font = '12px sans-serif';

        // Create visualization of the function
        let isobands = new Array(width * height);
        let isolines, exp, plusVal, shiftVal = 0;

        // Decide on a scale
        if(this.func.hasGlobalMin()) {
            shiftVal = this.func.val(this.func.getGlobalMin());
            isolines = [0, 0.125];
            exp = 1.5;
            plusVal = 0;
        } else {
            shiftVal = 0;
            const scale = this.func.getScale(),
                  vals = [
                    this.func.val([0, 0]),
                    this.func.val([scale, 0]),
                    this.func.val([0, scale]),
                    this.func.val([-scale, 0]),
                    this.func.val([0, -scale]),
                    this.func.val([scale, scale]),
                    this.func.val([-scale, -scale]),
                    this.func.val([scale, -scale]),
                    this.func.val([-scale, scale]),
                  ],
                  min = Math.min(...vals),
                  max = Math.max(...vals);
            isolines = [min];
            exp = 1;
            plusVal = (max - min) / 15;
        }

        // Very simple approach to draw the isolines (my simplified version of the marching squares algorithm)
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const x = (i - centerX) / this.scale, y = -(j - centerY) / this.scale,
                      val = this.func.val([x, y]),
                      idx = i + j * width;

                while(val > shiftVal + isolines[isolines.length - 1]) isolines.push(isolines[isolines.length - 1] * exp + plusVal);
                for(let k = 1; k < isolines.length; ++k) {
                    if(val < shiftVal + isolines[k]) {
                        isobands[idx] = k - 1;
                        break;
                    }
                }
            }
        }

        // Calculate colors for the isolines
        let isolinesColors = []
        for(let i = 0; i < isolines.length; ++i){
            isolinesColors.push(Utils.lerpColor(this.colors[0], this.colors[this.colors.length - 1], (i + 1) / (isolines.length + 1)));
        }

        // TODO: use imageData instead of fillRect
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const idx = i + j * width;
                const sum = -3 * isobands[idx] + isobands[idx + 1] + isobands[idx + width] + isobands[idx + 1 + width];
                this.ctx.fillStyle = isolinesColors[isobands[idx]];
                if(sum != 0 && sum != 4) this.ctx.fillRect(i, j, 1, 1);
            }
        }

        // Add X and Y axis
        this.ctx.fillStyle = this.colors[0];

        let labelsDist = 0.5;
        if(this.scale > 3.0) labelsDist = 1.0;

        for(let i = 0; i < centerX / this.scale; i += labelsDist){
            this.ctx.fillText(i.toFixed(1), centerX + i * this.scale, height - 22);
            if(i != 0) this.ctx.fillText((-i).toFixed(1), centerX - i * this.scale, height - 22);
        }
        for(let i = 0; i < centerY / this.scale; i += labelsDist){
            this.ctx.fillText(i.toFixed(1), 10, centerY + i * this.scale);
            if(i != 0) this.ctx.fillText((-i).toFixed(1), 10, centerY - i * this.scale);
        }

        // Init optimizers
        const start = this.func.getStartPoint();
        this.optims = [
            new SGD(start),
            new Momentum(start),
            new AdaGrad(start),
            new RMSProp(start),
            new Adam(start),
            new AdaMax(start),
            new AMSGrad(start)
        ];

        // Draw legend
        let textYOffset = 22;
        const textXOffset = 50;
        const lineHeight = 20;

        this.ctx.fillText(this.func.getName(), textXOffset, textYOffset)
        if(this.func.hasGlobalMin()) {
            textYOffset += lineHeight;
            const globalMin = this.func.getGlobalMin()
            this.ctx.fillText("Optimum: f(x*) = " + Math.round(this.func.val(globalMin) * 10000) / 10000 + ", at x* =  (" + globalMin[0] + ", " + globalMin[1] + ")", textXOffset, textYOffset);
            Utils.fillCircle(this.ctx, this.colors[0], centerX + globalMin[0] * this.scale, centerY + -globalMin[1] * this.scale, 2);
        }

        textYOffset += lineHeight;
        this.ctx.fillText("Starting point: x0 = (" + start[0] + ", " + start[1] + ")", textXOffset, textYOffset);

        textYOffset += 2 * lineHeight;
        this.ctx.fillText("Optimizers:", textXOffset, textYOffset);

        for(let i = 0; i < this.optims.length; ++i){
            textYOffset += lineHeight;
            this.ctx.fillStyle = this.colorsAlt[i];
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText("    " + this.optims[i].getName(), textXOffset, textYOffset);
            Utils.fillCircle(this.ctx, this.colorsAlt[i], textXOffset + 3, textYOffset - 4, 3);
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

module.exports = GradientDescent;
