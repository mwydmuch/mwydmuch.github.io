'use strict';

const NAME = "visualization of gradient descent algorithms",
      FILE = "gradient-descent.js",
      DESC = `
Visualization of the popular gradient descent-based optimizers.
Default hyperparameters are set to recommended values
according to the original papers or/and PyTorch documentation.

The objective functions were taken from this very nice 
[website](https://www.sfu.ca/~ssurjano/optimization.html).

You can select the starting point by clicking/touching the canvas.

The interesting challenge related to this animation was 
to efficiently visualize the optimized function. 
This is done by using simplified version of the marching squares algorithm.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("../animation");
const Utils = require("../utils");

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
    constructor(name, globalMin, startPoints, scale, shift=[0, 0]) {
        this.name = name;
        this.globalMin = globalMin;
        this.startPoints = startPoints;
        this.drawScale = scale;
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
        return this.drawScale;
    }

    getName(){
        return this.name;
    }
}


class SaddlePointFunc extends Func {
    constructor() {
        super("Two-dimensional function with saddle point: f(x) = x[0]^2 - x[1]^2",
            null, [[-1, 0.001], [-1, -0.0001], [1, 0.01], [1, -0.001]], 1.1);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return x * x - y * y;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return [2 * x, -2 * y];
    }
}


class AckleyFunc extends Func{
    constructor() {
        super("Two-dimensional non-convex, multimodal Ackley function",
            [0, 0], [[0, 5], [0, -5], [5, 0], [-5, 0], [0.5, 5], [5, 0.5], [0.5, -5], [-5, 0.5]], 5.5);
        this.a = 20;
        this.b = 0.2;
        this.c = 2 * Math.PI;
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1], n = 2
        //         return -a * exp(-b * sqrt(1.0/n * (x * x + y * y))) - exp(1.0/n * (cos(c * x) + cos(c * y))) + E + a;
        return -this.a * Math.exp(-this.b * Math.sqrt(1.0/n * (x * x + y * y))) - Math.exp(1.0/n * (Math.cos(this.c * x) + Math.cos(this.c * y))) + Math.E + this.a;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        const r = Math.sqrt(0.5 * (x * x + y * y));
        return [
            2 * Math.PI * Math.sin(2 * Math.PI * x) * Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y))) + 0.4 * x * Math.exp(-0.2 * r) / r,
            //(a b e^(-b sqrt((x^2 + y^2)/n)) x)/(n sqrt((x^2 + y^2)/n)) + (c e^((cos(c x) + cos(c y))/n) sin(c x))/n
            2 * Math.PI * Math.sin(2 * Math.PI * y) * Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y))) + 0.4 * y * Math.exp(-0.2 * r) / r
        ];
    }
}


class BealeFunc extends Func{
    constructor() {
        super("Two-dimensional non-convex, multimodal BEALE function",
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
        ];
    }
}


class StyblinskiTangFunc extends Func{
    constructor() {
        super("Two variables non-convex, multimodal Stybliski-Tang function",
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
        ];
    }
}


class RosenbrockFunc extends Func{
    constructor() {
        super("Two-dimensional non-convex, multimodal Rosenbrock function",
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
        ];
    }
}

class JennrichSampsonkFunc extends Func{
    constructor() {
        super("Two-dimensional non-convex, multimodal Jennrich-Sampson function",
            [0.257825, 0.257825], [[-0.75, -0.75]], 1);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        let val = 0;
        for(let i = 1; i <= 10; ++i){
            val += Math.pow(2 + 2 * i - Math.exp(i * x) - Math.exp(i * y), 2);
        }
        return val;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1],
              x2 = x * x,
              x3 = x2 * x;
        return [
            0, 0
        ];
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
        ];
    }
}


class GradientDescent extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor, 
                functionToOptimize = "random",
                scale = 1,
                rounding = 5,
                autoRestart = true,
                autoRestartSteps = 1000){
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        //this.funcNames = ["with saddle point", "BEALE", "Jennrich-Sampsonk", "Rosenbrock", "Styblinski-Tang"];
        this.funcNames = ["with saddle point", "BEALE", "Rosenbrock", "Styblinski-Tang"];
        this.functionToOptimize = this.assignIfRandom(functionToOptimize, Utils.randomChoice(this.funcNames));
        //this.funcClasses = [SaddlePointFunc, BealeFunc, JennrichSampsonkFunc, RosenbrockFunc, StyblinskiTangFunc];
        this.funcClasses = [SaddlePointFunc, BealeFunc, RosenbrockFunc, StyblinskiTangFunc];
        this.scale = scale;
        this.rounding = rounding;
        this.autoRestart = autoRestart;
        this.autoRestartSteps = autoRestartSteps;

        this.func = null;
        this.start = null;
        this.optims = null;
        this.imageData = null;
        
        this.drawScale = 0;
        this.functionImageData = null;

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

        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        for (let i = 0; i < this.optims.length; ++i) {
            let x1, y1, x2, y2,
                o = this.optims[i];
            [x1, y1] = o.w;
            o.update(this.func.grad(o.w));
            [x2, y2] = o.w;

            if(!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) continue;
            if(isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) continue;
            if(Math.abs(x1) > 1e4 || Math.abs(y1) > 1e4 || Math.abs(x2) > 1e4 || Math.abs(y2) > 1e4) continue;
            Utils.drawLine(this.ctx, x1 * this.drawScale, -y1 * this.drawScale, x2 * this.drawScale, -y2 * this.drawScale, 2, this.colorsAlt[i]);
        }
        this.ctx.resetTransform();

        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

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
                  text = `${this.optims[i].getName()}: f([${x}, ${y}]) = ${this.func.val([x, y]).toFixed(this.rounding)}`;
            Utils.fillAndStrokeText(this.ctx, text, this.textXOffset + 16, optimTextYOffset);
            Utils.fillCircle(this.ctx, this.textXOffset + 3, optimTextYOffset - 4, 3, this.colorsAlt[i]);
        }

        if (this.autoRestart && this.frame >= this.autoRestartSteps){
            this.start = null;
            this.resize();
        }
    }

    drawFunction() {
        if(this.functionImageData){
            this.ctx.putImageData(this.functionImageData, 0, 0);
            return;
        }

        this.clear();

        const width = this.canvas.width,
              height = this.canvas.height,
              centerX = width / 2,
              centerY = height / 2,
              funcScale = this.func.getScale(),
              visibleRange = funcScale / this.scale,
              maxVisibleRange = funcScale / 0.5;
        this.drawScale = Math.min(width, height) / funcScale / 2 * this.scale;
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
            const vals = [
                    this.func.val([0, 0]),
                    this.func.val([maxVisibleRange, 0]),
                    this.func.val([0, maxVisibleRange]),
                    this.func.val([-maxVisibleRange, 0]),
                    this.func.val([0, -maxVisibleRange]),
                    this.func.val([maxVisibleRange, maxVisibleRange]),
                    this.func.val([-maxVisibleRange, -maxVisibleRange]),
                    this.func.val([maxVisibleRange, -maxVisibleRange]),
                    this.func.val([-maxVisibleRange, maxVisibleRange]),
                  ],
                  min = Math.min(...vals),
                  max = Math.max(...vals);
            isolines = [min];
            exp = 1;
            plusVal = (max - min) / 29;
        }

        // Very simple (but fast!) approach to draw the isolines (my simplified version of the marching squares algorithm)
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const x = (i - centerX) / this.drawScale, y = -(j - centerY) / this.drawScale,
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
        let isolinesColors = [];
        for(let i = 0; i < isolines.length; ++i){
            isolinesColors.push(Utils.lerpColor(this.colorA, this.colorB, (i + 1) / (isolines.length + 1)));
        }

        // Draw the isolines
        // Note: consider using imageData instead of fillRect for better performance
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

        // Adjust X, Y axis labels
        let labelsDist = 0.5;
        if(visibleRange > 6.0) labelsDist = 2.0;
        else if(visibleRange > 3.0) labelsDist = 1.0;
       
        for(let i = 0; i < centerX / this.drawScale; i += labelsDist){
            Utils.fillAndStrokeText(this.ctx, i.toFixed(1), centerX + i * this.drawScale, height - 22);
            if(i !== 0) Utils.fillAndStrokeText(this.ctx, (-i).toFixed(1), centerX - i * this.drawScale, height - 22);
        }
        for(let i = 0; i < centerY / this.drawScale; i += labelsDist){
            Utils.fillAndStrokeText(this.ctx, (-i).toFixed(1), 10, centerY + i * this.drawScale);
            if(i !== 0) Utils.fillAndStrokeText(this.ctx, (i).toFixed(1), 10, centerY - i * this.drawScale);
        }

        this.functionImageData = this.ctx.getImageData(0, 0, width, height);
        this.functionImageData.drawScale = this.drawScale;
        this.functionImageData.scale = this.scale;
    }

    drawLegend() {
        const width = this.canvas.width,
              height = this.canvas.height,
              centerX = width / 2,
              centerY = height / 2;

        this.textYOffset = 22;
        this.textXOffset = 50;
        this.resetFont();

        Utils.fillAndStrokeText(this.ctx, this.func.getName(), this.textXOffset, this.textYOffset);
        if(this.func.hasGlobalMin()) {
            this.textYOffset += this.lineHeight;
            const globalMin = this.func.getGlobalMin();
            Utils.fillAndStrokeText(this.ctx, `Optimum: f(x*) = ${this.func.val(globalMin).toFixed(this.rounding)}, at x* = [${globalMin[0]}, ${globalMin[1]}]`, this.textXOffset, this.textYOffset, 2);
            Utils.fillCircle(this.ctx, centerX + globalMin[0] * this.drawScale, centerY + -globalMin[1] * this.drawScale, 2, this.colors[0]);
        }

        this.textYOffset += this.lineHeight;
        Utils.fillAndStrokeText(this.ctx, `Starting point: x0 = [${this.start[0].toFixed(this.rounding)}, ${this.start[1].toFixed(this.rounding)}], f(x0) = ${this.func.val(this.start).toFixed(this.rounding)}`, this.textXOffset, this.textYOffset);
        this.imageData = this.ctx.getImageData(0, 0, width, height);
    }

    mouseAction(cords, event) {
        if(event === "click"){
            this.start = [(cords.x - this.canvas.width / 2) / this.drawScale, -(cords.y - this.canvas.height / 2) / this.drawScale];
            this.resize();
        }
    }
    
    resize() {
        this.frame = 0;

        // Create the function to optimize 
        const funcCls = this.funcClasses[this.funcNames.indexOf(this.functionToOptimize)];
        let newFunc = new funcCls();
        
        if(this.func === null || this.func.getName() !== newFunc.getName()){
            this.func = newFunc;
            this.functionImageData = null;
            this.start = null;
        }

        // Check if the canvas size has changed
        if(this.functionImageData !== null 
            && (this.functionImageData.width !== this.canvas.width
            || this.functionImageData.height !== this.canvas.height
            || this.functionImageData.scale !== this.scale))
            this.functionImageData = null;

        // Select new starting point
        if(this.start === null) this.start = this.func.getStartPoint();

        // Draw function using isolines
        this.drawFunction();

        // Draw legend
        this.drawLegend();

        // Set optimizers
        for(let o of this.optims) o.init(this.start);
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.functionImageData = null;
        this.resize();
    }

    getSettings() {
        return [{prop: "functionToOptimize", icon: '<i class="fa-solid fa-chart-area"></i>', type: "select", values: this.funcNames, toCall: "resize"},
                {prop: "selectStartingPoint", type: "text", value: "<click/touch>"},
                {prop: "scale", icon: '<i class="fa-solid fa-maximize"></i>', type: "float", step: 0.1, min: 0.5, max: 1.5, toCall: "resize"},
                {prop: "autoRestart", icon: '<i class="fa-solid fa-clock-rotate-left"></i>', type: "bool"},
                {prop: "autoRestartSteps", type: "int", step: 1, min: 100, max: 10000},
                {type: "separator"},
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
