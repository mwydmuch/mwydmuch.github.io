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

This animation has also a [3D version](https://mwydmuch.pl/animations?animation=gradient-descent-(3D)).

Uses only Canvas API.
Coded by me (Marek Wydmuch) in 2021.
`;

const Animation = require("../animation");
const Utils = require("../utils");

const OPTIMIZER_COLORS = ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#56B4E9", "#8C564B", "#6A3D9A"],
      OPTIMUM_COLOR = "#FFD700";

class EtaScheduler {
    constructor(etaScale = 1, decay = 0.95, stepSize = 100) {
        if(typeof etaScale === "object"){
            this.params = etaScale;
        } else {
            this.etaScale = etaScale;
            this.decay = decay;
            this.stepSize = stepSize;
        }
    }

    getParams(){
        return this.params || this;
    }

    get(step){
        return this.getParams().etaScale;
    }
}

class ConstantEtaScheduler extends EtaScheduler {}

class StepDecayEtaScheduler extends EtaScheduler {
    get(step){
        const params = this.getParams(),
              safeStep = Math.max(0, step),
              safeStepSize = Math.max(1, params.stepSize),
              safeDecay = Math.max(0, params.decay);
        return super.get(step) * Math.pow(safeDecay, Math.floor(safeStep / safeStepSize));
    }
}

class ExponentialDecayEtaScheduler extends EtaScheduler {
    get(step){
        const params = this.getParams(),
              safeStep = Math.max(0, step),
              safeStepSize = Math.max(1, params.stepSize),
              safeDecay = Math.max(0, params.decay);
        return super.get(step) * Math.pow(safeDecay, safeStep / safeStepSize);
    }
}

// Optimizers
class Optim {
    constructor(name, eta) {
        this.name = name;
        this.eta = eta;
        this.enabled = true;
    }

    update(grad, etaModifier = 1){
        this.prevW = [...this.w];
        this.step += 1;
    }

    init(w){
        this.prevW = [...w];
        this.w = [...w];
        this.step = 0;
    }

    getName(){
        return this.name;
    }
}

class GD extends Optim {
    constructor(eta=0.001) {
        super("SGD", eta);
    }

    update(grad, etaModifier = 1){
        super.update(grad, etaModifier);
        const eta = this.eta * etaModifier;
        for(let i = 0; i < this.w.length; ++i){
            this.w[i] -= eta * grad[i];
        }
    }
}

class Momentum extends Optim {
    constructor(eta=0.001, beta=0.9) {
        super("Momentum", eta);
        this.beta = beta;
    }

    init(w){
        super.init(w);
        this.m = new Array(w.length).fill(0);
    }

    update(grad, etaModifier = 1){
        super.update(grad, etaModifier);
        const eta = this.eta * etaModifier;
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta * this.m[i] + (1 - this.beta) * grad[i];
            this.w[i] -= eta * this.m[i];
        }
    }
}

class AdaGrad extends Optim {
    constructor(eta = 0.1) {
        super("AdaGrad", eta);
    }

    init(w){
        super.init(w);
        this.v = new Array(w.length).fill(0);
    }

    update(grad, etaModifier = 1){
        super.update(grad, etaModifier);
        const eta = this.eta * etaModifier;
        for(let i = 0; i < this.w.length; ++i){
            this.v[i] += grad[i] * grad[i];
            this.w[i] -= eta / Math.sqrt(this.v[i] + 0.000001) * grad[i];
        }
    }
}

class RMSProp extends Optim {
    constructor(eta = 0.01, beta = 0.9) {
        super("RMSProp", eta);
        this.beta = beta;
    }

    init(w){
        super.init(w);
        this.v = new Array(w.length).fill(0);
    }

    update(grad, etaModifier = 1){
        super.update(grad, etaModifier);
        const eta = this.eta * etaModifier;
        for(let i = 0; i < this.w.length; ++i){
            this.v[i] = this.beta * this.v[i] + (1 - this.beta) * grad[i] * grad[i];
            this.w[i] -= eta / Math.sqrt(this.v[i] + 0.000001) * grad[i];
        }
    }
}

class Adam extends Optim {
    constructor(eta = 0.01, beta1 = 0.9, beta2 = 0.999) {
        super("Adam", eta);
        this.beta1 = beta1;
        this.beta2 = beta2;
    }

    init(w){
        super.init(w);
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad, etaModifier = 1){
        super.update(grad, etaModifier);
        const eta = this.eta * etaModifier;
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * grad[i] * grad[i];
            this.w[i] -= eta / (Math.sqrt(this.v[i] / (1 - this.beta2)) + 0.000001) * this.m[i] / (1 - this.beta1);
        }
    }
}

class AdaMax extends Optim {
    constructor(eta = 0.002, beta1 = 0.9, beta2 = 0.999) {
        super("AdaMax", eta);
        this.beta1 = beta1;
        this.beta2 = beta2;
    }
    
    init(w){
        super.init(w);
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad, etaModifier = 1){
        super.update(grad, etaModifier);
        const eta = this.eta * etaModifier;
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = Math.max(this.beta2 * this.v[i], Math.abs(grad[i]));
            this.w[i] -= eta / (this.v[i] + 0.000001) * this.m[i] / (1 - this.beta1);
        }
    }
}

class AMSGrad extends Optim {
    constructor(eta = 0.002, beta1 = 0.9, beta2 = 0.999) {
        super("AMSGrad", eta);
        this.beta1 = beta1;
        this.beta2 = beta2;
    }

    init(w){
        super.init(w);
        this.m = new Array(w.length).fill(0);
        this.v = new Array(w.length).fill(0);
    }

    update(grad, etaModifier = 1){
        super.update(grad, etaModifier);
        const eta = this.eta * etaModifier;
        for(let i = 0; i < this.w.length; ++i){
            this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * grad[i];
            this.v[i] = Math.max(this.beta2 * this.v[i] + (1 - this.beta2) * grad[i] * grad[i], this.v[i]);
            this.w[i] -= eta / (Math.sqrt(this.v[i]) + 0.000001) * this.m[i];
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

    getIsolineStart(){
        return 0.125;
    }

    getIsolineExp(){
        return 1.5;
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

class SharpMinimumFunc extends Func {
    constructor() {
        super("Smooth sharp minimum where Adam performs worse than SGD f(x) = sqrt(x[0]^2) + sqrt(x[1]^2)",
            [0, 0],
            [[0.05, 0.05], [0.05, -0.05], [-0.05, 0.05], [-0.05, -0.05]],
            0.12);
        this.eps = 0.00000001;
        this.sqrtEps = Math.sqrt(this.eps);
    }

    val(w) {
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return Math.sqrt(x * x + this.eps) + Math.sqrt(y * y + this.eps) - 2 * this.sqrtEps;
    }

    grad(w){
        const x = w[0] + this.shift[0], y = w[1] + this.shift[1];
        return [
            x / Math.sqrt(x * x + this.eps),
            y / Math.sqrt(y * y + this.eps)
        ];
    }

    getIsolineStart(){
        return 0.0001;
    }

    getIsolineExp(){
        return 1.3;
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
                autoRestartSteps = 1000,
                contextType = "2d"
            ) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC, "random", contextType);
        this.colorsAlt = OPTIMIZER_COLORS;
        this.optimumColor = OPTIMUM_COLOR;
        //this.funcNames = ["with saddle point", "BEALE", "Jennrich-Sampsonk", "Rosenbrock", "Styblinski-Tang"];
        this.funcNames = ["with saddle point", "smooth sharp minimum", "BEALE", "Rosenbrock", "Styblinski-Tang"];
        this.functionToOptimize = this.assignIfRandom(functionToOptimize, Utils.randomChoice(this.funcNames));
        //this.funcClasses = [SaddlePointFunc, BealeFunc, JennrichSampsonkFunc, RosenbrockFunc, StyblinskiTangFunc];
        this.funcClasses = [SaddlePointFunc, SharpMinimumFunc, BealeFunc, RosenbrockFunc, StyblinskiTangFunc];
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

        this.gd = new GD();
        this.momentum = new Momentum();
        this.adagrad = new AdaGrad();
        this.rmsprop = new RMSProp();
        this.adam = new Adam();
        this.adamax = new AdaMax();
        this.amsgrad = new AMSGrad();

        this.optims = [this.gd, this.momentum, this.adagrad, this.rmsprop, this.adam, this.adamax, this.amsgrad];
        this.etaSchedulerNames = ["constant", "step decay", "exponential decay"];
        this.etaSchedulerType = this.etaSchedulerNames[0];
        this.etaScheduler = new EtaScheduler();
        this.etaSchedulers = {
            "constant": new ConstantEtaScheduler(this.etaScheduler),
            "step decay": new StepDecayEtaScheduler(this.etaScheduler),
            "exponential decay": new ExponentialDecayEtaScheduler(this.etaScheduler)
        };
    }

    update(elapsed){
        super.update(elapsed);
        const etaScheduler = this.etaSchedulers[this.etaSchedulerType] || this.etaSchedulers["constant"],
              etaModifier = etaScheduler.get(this.frame);
        for (let i = 0; i < this.optims.length; ++i) {
            let o = this.optims[i];
            if(!o.enabled) continue;
            o.update(this.func.grad(o.w), etaModifier);
        }
    }

    formatNum(num){
        const fixed = num.toFixed(this.rounding);
        if (num > 0) return " " + fixed;
        return fixed;
    }

    draw() {
        if(this.imageData) this.ctx.putImageData(this.imageData, 0, 0);

        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        for (let i = 0; i < this.optims.length; ++i) {
            let x1, y1, x2, y2,
                o = this.optims[i];
            if(!o.enabled) continue;
            [x1, y1] = o.prevW;
            [x2, y2] = o.w;

            if(!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) continue;
            if(isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) continue;
            if(Math.abs(x1) > 1e4 || Math.abs(y1) > 1e4 || Math.abs(x2) > 1e4 || Math.abs(y2) > 1e4) continue;
            Utils.drawLine(this.ctx, x1 * this.drawScale, -y1 * this.drawScale, x2 * this.drawScale, -y2 * this.drawScale, 2, this.colorsAlt[i]);
        }
        this.ctx.resetTransform();

        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        for (let i = 0; i < this.optims.length; ++i) {
            const o = this.optims[i],
                  x = o.w[0],
                  y = o.w[1];
            if(!o.enabled) continue;
            if(!isFinite(x) || !isFinite(y)) continue;
            if(isNaN(x) || isNaN(y)) continue;
            if(Math.abs(x) > 1e4 || Math.abs(y) > 1e4) continue;

            Utils.fillCircle(this.ctx, x * this.drawScale, -y * this.drawScale, 5, this.colorsAlt[i]);
            this.ctx.lineWidth = 2;
            Utils.strokeCircle(this.ctx, x * this.drawScale, -y * this.drawScale, 6, this.bgColor);
        }
        this.ctx.resetTransform();

        this.drawOptimizerLegend();

        if (this.autoRestart && this.frame >= this.autoRestartSteps){
            this.start = null;
            this.resize();
        }
    }

    drawOptimizerLegend(ctx = this.ctx, optimTextYOffset = this.textYOffset + 2 * this.lineHeight) {
        this.resetFont(ctx);
        Utils.fillAndStrokeText(ctx, `Steps: ${this.frame}`, this.textXOffset, optimTextYOffset);
        optimTextYOffset += this.lineHeight;
        Utils.fillAndStrokeText(ctx, "Optimizers:", this.textXOffset, optimTextYOffset);
        for(let i = 0; i < this.optims.length; ++i){
            if(!this.optims[i].enabled) continue;
            optimTextYOffset += this.lineHeight;
            ctx.fillStyle = this.colorsAlt[i];
            const x = this.formatNum(this.optims[i].w[0]),
                  y = this.formatNum(this.optims[i].w[1]),
                  text = `${this.optims[i].getName()}: f([${x}, ${y}]) = ${this.formatNum(this.func.val([x, y]))}`;
            Utils.fillAndStrokeText(ctx, text, this.textXOffset + 16, optimTextYOffset);
            Utils.fillCircle(ctx, this.textXOffset + 3, optimTextYOffset - 4, 3, this.colorsAlt[i]);
        }

        return optimTextYOffset;
    }

    getIsolineLevels(minVal, maxVal, count = 29) {
        const levels = [];
        if(!isFinite(minVal) || !isFinite(maxVal) || minVal === maxVal) return levels;
        if(minVal > maxVal) [minVal, maxVal] = [maxVal, minVal];

        if(this.func.hasGlobalMin()) {
            const shiftVal = this.func.val(this.func.getGlobalMin()),
                  exp = this.func.getIsolineExp();
            let delta = this.func.getIsolineStart();

            while(shiftVal + delta < maxVal && levels.length < count * 3) {
                const level = shiftVal + delta;
                if(level > minVal && level < maxVal) levels.push(level);
                delta *= exp;
                if(!isFinite(delta) || delta <= 0 || exp <= 1) break;
            }

            if(levels.length > 0) return levels;
        }

        for(let i = 1; i <= count; ++i) {
            levels.push(minVal + (maxVal - minVal) * i / (count + 1));
        }
        return levels;
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
              visibleRange = funcScale / this.scale;
        this.drawScale = Math.min(width, height) / funcScale / 2 * this.scale;
        this.ctx.fillStyle = this.colors[0];
        this.ctx.strokeStyle = this.bgColor;
        this.ctx.font = '12px sans-serif';

        // Create a visualization of the function
        let isobands = new Array(width * height);
        let values = new Array(width * height),
            minVal = Infinity,
            maxVal = -Infinity;

        // Very simple (but fast!) approach to draw isolines (my simplified version of the marching squares algorithm)
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const x = (i - centerX) / this.drawScale, y = -(j - centerY) / this.drawScale,
                      val = this.func.val([x, y]),
                      idx = i + j * width;
                values[idx] = val;
                if(isFinite(val)) {
                    minVal = Math.min(minVal, val);
                    maxVal = Math.max(maxVal, val);
                }
            }
        }

        const isolines = this.getIsolineLevels(minVal, maxVal);
        for(let idx = 0; idx < values.length; ++idx) {
            const val = values[idx];
            let band = isolines.length;
            for(let k = 0; k < isolines.length; ++k) {
                if(val < isolines[k]) {
                    band = k;
                    break;
                }
            }
            isobands[idx] = band;
        }

        // Calculate colors for the isolines
        const bandsCount = isolines.length + 1;
        let isolinesColors = [];
        for(let i = 0; i < bandsCount; ++i){
            isolinesColors.push(Utils.lerpColorHex(this.mainColor, this.secColor, (i + 1) / (bandsCount + 1)));
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
        else if(visibleRange <= 0.2) labelsDist = 0.05;
        else if(visibleRange <= 0.5) labelsDist = 0.1;
       
        for(let i = 0; i < centerX / this.drawScale; i += labelsDist){
            const label = i.toFixed(labelsDist < 0.1 ? 2 : 1);
            Utils.fillAndStrokeText(this.ctx, label, centerX + i * this.drawScale, height - 22);
            if(i !== 0) Utils.fillAndStrokeText(this.ctx, (-i).toFixed(labelsDist < 0.1 ? 2 : 1), centerX - i * this.drawScale, height - 22);
        }
        for(let i = 0; i < centerY / this.drawScale; i += labelsDist){
            Utils.fillAndStrokeText(this.ctx, (-i).toFixed(labelsDist < 0.1 ? 2 : 1), 10, centerY + i * this.drawScale);
            if(i !== 0) Utils.fillAndStrokeText(this.ctx, (i).toFixed(labelsDist < 0.1 ? 2 : 1), 10, centerY - i * this.drawScale);
        }

        if(this.func.hasGlobalMin()){
            const globalMin = this.func.getGlobalMin(),
                  starX = centerX + globalMin[0] * this.drawScale,
                  starY = centerY - globalMin[1] * this.drawScale;
            this.ctx.fillStyle = this.optimumColor;
            this.ctx.beginPath();
            Utils.pathStar(this.ctx, starX, starY, 7, 3, 5);
            this.ctx.fill();
            this.ctx.stroke();
        }

        this.functionImageData = this.ctx.getImageData(0, 0, width, height);
        this.functionImageData.drawScale = this.drawScale;
        this.functionImageData.scale = this.scale;
    }

    drawLegend(ctx = this.ctx) {
        this.textYOffset = 22;
        this.textXOffset = 50;
        this.resetFont(ctx);

        Utils.fillAndStrokeText(ctx, this.func.getName(), this.textXOffset, this.textYOffset);
        if(this.func.hasGlobalMin()) {
            this.textYOffset += this.lineHeight;
            const globalMin = this.func.getGlobalMin();
            Utils.fillAndStrokeText(ctx, `Optimum: f(x*) = ${this.func.val(globalMin).toFixed(this.rounding)}, at x* = [${globalMin[0]}, ${globalMin[1]}]`, this.textXOffset, this.textYOffset, 2);
        }

        this.textYOffset += this.lineHeight;
        Utils.fillAndStrokeText(ctx, `Starting point: x0 = [${this.start[0].toFixed(this.rounding)}, ${this.start[1].toFixed(this.rounding)}], f(x0) = ${this.func.val(this.start).toFixed(this.rounding)}`, this.textXOffset, this.textYOffset);
    }

    mouseAction(cords, event) {
        if(event === "click"){
            this.start = [(cords.x - this.canvas.width / 2) / this.drawScale, -(cords.y - this.canvas.height / 2) / this.drawScale];
            this.resize();
        }
    }
    
    resize() {
        super.resize();
        
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

        // Select a new starting point
        if(this.start === null) this.start = this.func.getStartPoint();

        // Draw the function using isolines
        this.drawFunction();

        // Draw a legend
        this.drawLegend();

        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Set the optimizers
        for(let o of this.optims) o.init(this.start);
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.colorsAlt = OPTIMIZER_COLORS;
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
                {prop: "etaSchedulerType", name: "eta scheduler", type: "select", values: this.etaSchedulerNames},
                {prop: "etaScheduler.etaScale", name: "eta scale", type: "float", step: 0.01, min: 0, max: 10},
                {prop: "etaScheduler.decay", name: "scheduler decay", type: "float", step: 0.001, min: 0, max: 1},
                {prop: "etaScheduler.stepSize", name: "scheduler step size", type: "int", step: 1, min: 1, max: 1000},
                {type: "separator"},
                {prop: "gd.enabled", name: "vanilla gradient descent", type: "bool", toCall: "resize"},
                {prop: "gd.eta", type: "float", step: 0.0001, min: 0, max: 0.1},
                {prop: "momentum.enabled", name: "gd + momentum", type: "bool", toCall: "resize"},
                {prop: "momentum.eta", type: "float", step: 0.0001, min: 0, max: 0.1},
                {prop: "momentum.beta", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "adagrad.enabled", name: "adagrad", type: "bool", toCall: "resize"},
                {prop: "adagrad.eta", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "rmsprop.enabled", name: "rmsprop", type: "bool", toCall: "resize"},
                {prop: "rmsprop.eta", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "adam.enabled", name: "adam", type: "bool", toCall: "resize"},
                {prop: "adam.eta", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "adam.beta1", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "adam.beta2", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "adamax.enabled", name: "adamax", type: "bool", toCall: "resize"},
                {prop: "adamax.eta", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "adamax.beta1", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "adamax.beta2", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "amsgrad.enabled", name: "amsgrad", type: "bool", toCall: "resize"},
                {prop: "amsgrad.eta", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "amsgrad.beta1", type: "float", step: 0.0001, min: 0, max: 1},
                {prop: "amsgrad.beta2", type: "float", step: 0.0001, min: 0, max: 1},
                ];
    }
}

module.exports = GradientDescent;
