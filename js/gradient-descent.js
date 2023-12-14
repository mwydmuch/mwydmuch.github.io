'use strict';

const NAME = "visualization of gradient descent algorithms",
      FILE = "gradient-descent.js",
      DESC = `
Visualization of gradient descent-based optimizers.
Default hyperparameters are set to recommended values.

The functions were taken from this very nice 
[website](https://www.sfu.ca/~ssurjano/optimization.html).

You can select the starting point by clicking/touching the canvas.

Coded with no external dependencies, using only canvas API.
`;


const Animation = require("./animation");
const Utils = require("./utils");


// Optimizers
class Optim {
    constructor(name) {
        this.name = name;
    }

    update(grad){
        return 0;
    }

    init(w){
        this.w = [...w];
    }

    getName(){
        return this.name;
    }
}

class SGD extends Optim {
    constructor(eta=0.001) {
        super("SGD");
        this.eta = eta;
    }

    update(grad){
        for(let i = 0; i < this.w.length; ++i){
            this.w[i] -= this.eta * grad[i];
        }
    }
}

class Momentum extends Optim {
    constructor(eta=0.001, beta=0.9) {
        super("Momentum");
        this.eta = eta;
        this.beta = beta;
    }

    init(w){
        super.init(w);
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
    constructor(eta = 0.1) {
        super("AdaGrad");
        this.eta = eta;
    }

    init(w){
        super.init(w);
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
    constructor(eta = 0.01, beta = 0.9) {
        super("RMSProp");
        this.eta = eta;
        this.beta = beta;
    }

    init(w){
        super.init(w);
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
    constructor(eta = 0.01, beta1 = 0.9, beta2 = 0.999) {
        super("Adam");
        this.eta = eta;
        this.beta1 = beta1;
        this.beta2 = beta2;
    }

    init(w){
        super.init(w);
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
    constructor(alpha = 0.002, beta1 = 0.9, beta2 = 0.999) {
        super("AdaMax");
        this.alpha = alpha;
        this.beta1 = beta1;
        this.beta2 = beta2;
    }
    
    init(w){
        super.init(w);
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
    constructor(alpha = 0.002, beta1 = 0.9, beta2 = 0.999) {
        super("AMSGrad");
        this.alpha = alpha;
        this.beta1 = beta1;
        this.beta2 = beta2;
    }

    init(w){
        super.init(w);
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
    constructor(name, globalMin, startPoints, scale, shift=[0, 0], steps= 1000) {
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
        return this.globalMin !== null;
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
        super("Two-dimensional non-convex function with saddle point: f(x) = x[0]^2 - x[1]^2",
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
            [-2.903534, -2.903534], [[0, 5], [0, -5], [5, 0], [-5, 0], [-0.5, -5], [-5, -0.5], [-5, -5]], 5.5);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            x2 = x * x,
            x4 = x2 * x2,
            y2 = y * y,
            y4 = y2 * y2;
        return ((x4 - 16 * x2 + 5 * x) + (y4 - 16 * y2 + 5 * y)) / 2 + 78.33233;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            x3 = Math.pow(x, 3),
            y3 = Math.pow(y, 3);
        return [
            2 * x3 - 16 * x + 5 / 2,
            2 * y3 - 16 * y + 5 / 2
        ]
    }
}


class RosenbrockFunc extends Func{
    constructor() {
        super("Two-dimensional non-convex Rosenbrock function",
            [1, 1], [[-2.5, -2.5], [2.5, -2.5], [0, 2.5]], 1.5 * 2.048);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return 100 * Math.pow(y - x * x, 2) + Math.pow(1 - x, 2);
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
            x2 = x * x,
            x3 = x2 * x;
        return [
            2 * (-1 + x + 200 * x3 - 200 * x * y),
            200 * (-x2 + y)
        ]
    }
}


class GriewankFunc extends Func{ // This one is not used as it doesn't look good
    constructor() {
        let scale = 5,
            start = 0.9 * scale;
        super("Two-dimensional non-convex Griewank function with many local optima",
            [0, 0], 
            [
                [0, start], [0, -start], [start, 0], [-start, 0], 
                [start, start], [-start, start], [start, -start] [-start, -start]
            ], scale);
        this.sqrt2 = Math.sqrt(2);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return (x * x + y * y) / 4000 - Math.cos(x / this.sqrt2) * Math.cos(y / this.sqrt2) + 1;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return [
            x / 2000 + Math.cos(x / this.sqrt2) * Math.sin(x / this.sqrt2) / this.sqrt2,
            y / 2000 + Math.cos(y / this.sqrt2) * Math.sin(y / this.sqrt2) / this.sqrt2,
        ]
    }
}


class GradientDescent extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor, 
                functionToOptimize = "random",
                autoRestart = true,
                rounding = 5) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.funcNames = ["with saddle point", "Beale", "Rosenbrock", "Styblinski-Tang"];
        this.functionToOptimize = this.assignIfRandom(functionToOptimize, Utils.randomChoice(this.funcNames));
        this.funcClasses = [SaddlePointFunc, BealeFunc, RosenbrockFunc, StyblinskiTangFunc];
        this.autoRestart = autoRestart;
        this.rounding = rounding;

        this.scale = 0;
        this.optims = null;
        this.imageData = null;

        this.functionImageData = null;
        this.functionImageDataName = "";

        this.sgd = new SGD();
        this.momentum = new Momentum();
        this.adagrad = new AdaGrad();
        this.rmsprop = new RMSProp();
        this.adam = new Adam();
        this.adamax = new AdaMax();
        this.amsgrad = new AMSGrad();

        this.optims = [this.sgd, this.momentum, this.adagrad, this.rmsprop, this.adam, this.adamax, this.amsgrad];
    }

    draw() {
        if(this.imageData) this.ctx.putImageData(this.imageData, 0, 0);

        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        for (let i = 0; i < this.optims.length; ++i) {
            let x1, y1, x2, y2;
            let o = this.optims[i];
            [x1, y1] = o.w;
            o.update(this.func.grad(o.w));
            [x2, y2] = o.w;

            if(!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) continue;
            if(isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) continue;
            if(Math.abs(x1) > 1e4 || Math.abs(y1) > 1e4 || Math.abs(x2) > 1e4 || Math.abs(y2) > 1e4) continue;
            Utils.drawLine(this.ctx, x1 * this.scale, -y1 * this.scale, x2 * this.scale, -y2 * this.scale, 2, this.colorsAlt[i]);
        }
        this.ctx.resetTransform();

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.resetFont();
        let optimTextYOffset = this.textYOffset + 2 * this.lineHeight;
        Utils.fillAndStrokeText(this.ctx, `Steps: ${this.frame}`, this.textXOffset, optimTextYOffset);
        optimTextYOffset += this.lineHeight;
        Utils.fillAndStrokeText(this.ctx, "Optimizers:", this.textXOffset, optimTextYOffset);
        for(let i = 0; i < this.optims.length; ++i){
            optimTextYOffset += this.lineHeight;
            this.ctx.fillStyle = this.colorsAlt[i];
            const x = this.optims[i].w[0].toFixed(this.rounding),
                  y = this.optims[i].w[1].toFixed(this.rounding),
                  text = `${this.optims[i].getName()}: f(${x}, ${y}) = ${this.func.val([x, y]).toFixed(this.rounding)}`;
            Utils.fillAndStrokeText(this.ctx, text, this.textXOffset + 16, optimTextYOffset);
            Utils.fillCircle(this.ctx, this.textXOffset + 3, optimTextYOffset - 4, 3, this.colorsAlt[i]);
        }

        if (this.frame >= this.func.getSteps() && this.autoRestart) this.resize();
    }

    drawFunction() {
        this.clear();

        // Create function
        let funcCls = this.funcClasses[this.funcNames.indexOf(this.functionToOptimize)];
        this.func = new funcCls();

        if(this.functionImageData 
            && this.functionImageDataName === this.func.getName()
            && this.functionImageData.width === this.ctx.canvas.width
            && this.functionImageData.height === this.ctx.canvas.height
        ){
            this.ctx.putImageData(this.functionImageData, 0, 0);
            return;
        }

        this.functionImageDataName = this.func.getName();
        const width = this.ctx.canvas.width,
              height = this.ctx.canvas.height,
              centerX = width / 2,
              centerY = height / 2;
        this.scale = Math.min(width, height) / this.func.getScale() / 2;
        this.ctx.fillStyle = this.colors[0];
        this.ctx.strokeStyle = this.bgColor;
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
            isolinesColors.push(Utils.lerpColor(this.colors[0], this.colors[3], (i + 1) / (isolines.length + 1)));
        }

        // TODO: use imageData instead of fillRect for better performance
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const idx = i + j * width;
                const sum = -3 * isobands[idx] + isobands[idx + 1] + isobands[idx + width] + isobands[idx + 1 + width];
                this.ctx.fillStyle = isolinesColors[isobands[idx]];
                if(sum !== 0 && sum !== 4) this.ctx.fillRect(i, j, 1, 1);
            }
        }

        // Add X and Y axis
        this.ctx.fillStyle = this.colors[0];

        let labelsDist = 0.5;
        if(this.scale > 3.0) labelsDist = 1.0;

        for(let i = 0; i < centerX / this.scale; i += labelsDist){
            this.ctx.fillText(i.toFixed(1), centerX + i * this.scale, height - 22);
            if(i !== 0) this.ctx.fillText((-i).toFixed(1), centerX - i * this.scale, height - 22);
        }
        for(let i = 0; i < centerY / this.scale; i += labelsDist){
            this.ctx.fillText((-i).toFixed(1), 10, centerY + i * this.scale);
            if(i !== 0) this.ctx.fillText((i).toFixed(1), 10, centerY - i * this.scale);
        }

        this.functionImageData = this.ctx.getImageData(0, 0, width, height);
    }

    drawLegend(start) {
        const width = this.ctx.canvas.width,
              height = this.ctx.canvas.height,
              centerX = width / 2,
              centerY = height / 2;

        this.textYOffset = 22;
        this.textXOffset = 50;
        this.resetFont();

        this.ctx.fillText(this.func.getName(), this.textXOffset, this.textYOffset)
        if(this.func.hasGlobalMin()) {
            this.textYOffset += this.lineHeight;
            const globalMin = this.func.getGlobalMin()
            Utils.fillAndStrokeText(this.ctx, `Optimum: f(x*) = ${this.func.val(globalMin).toFixed(this.rounding)}, at x* =  (${globalMin[0]}, ${globalMin[1]})`, this.textXOffset, this.textYOffset, 2);
            Utils.fillCircle(this.ctx, centerX + globalMin[0] * this.scale, centerY + -globalMin[1] * this.scale, 2, this.colors[0]);
        }

        this.textYOffset += this.lineHeight;
        Utils.fillAndStrokeText(this.ctx, `Starting point: x0 = (${start[0].toFixed(this.rounding)}, ${start[1].toFixed(this.rounding)})`, this.textXOffset, this.textYOffset);
        this.imageData = this.ctx.getImageData(0, 0, width, height);
    }

    mouseAction(cords, event) {
        if(event === "click"){
            let start = [(cords.x - this.ctx.canvas.width / 2) / this.scale, -(cords.y - this.ctx.canvas.height / 2) / this.scale];
            this.resize(start);
        }
    }
    
    resize(start = null) {
        this.frame = 0;
        
        // Draw function using isolines
        this.drawFunction();

        // Set optimizers
        if(start === null) start = this.func.getStartPoint();
        for(let o of this.optims) o.init(start);

        // Draw legend
        this.drawLegend(start);
    }

    getSettings() {
        return [{prop: "functionToOptimize", type: "select", values: this.funcNames, toCall: "resize"},
                {prop: "selectStartingPoint", type: "text", value: "<click/touch>"},
                {prop: "autoRestart", type: "bool"},
                {prop: "sgd.eta", type: "float", step: 0.00001, min: 0, max: 0.1},
                {prop: "momentum.eta", type: "float", step: 0.00001, min: 0, max: 0.1},
                {prop: "momentum.beta", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "adagrad.eta", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "rmsprop.eta", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "adam.eta", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "adam.beta1", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "adam.beta2", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "adamax.alpha", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "adamax.beta1", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "adamax.beta2", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "amsgrad.alpha", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "amsgrad.beta1", type: "float", step: 0.00001, min: 0, max: 1},
                {prop: "amsgrad.beta2", type: "float", step: 0.00001, min: 0, max: 1},
                ];
    }
}

module.exports = GradientDescent;
