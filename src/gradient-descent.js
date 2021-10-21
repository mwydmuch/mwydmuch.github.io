/*
 * Visualization of
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");


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

class Nadam extends Optim {
    constructor (w) {
        super(w, "Nadam");
        this.eta = 0.001;
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


class Func {
    constructor(name, globalMin, startPoint, range) {
        this.name = name;
        this.globalMin = globalMin;
        this.startPoint = startPoint;
        this.range = range;
    }

    hasGlobalMin(){
        return this.globalMin != null;
    }

    getGlobalMin(){
        return this.globalMin;
    }

    getRange(){
        return this.range;
    }

    getStartPoint(){
        return this.startPoint;
    }

    getName(){
        return this.name;
    }
}


class SaddlePointFunc extends Func {
    constructor() {
        super("f(x, y) = x^2 - y^2", null, [-1, 0.001], [-1, 1]);
    }

    val(w) {
        const x = w[0], y = w[1];
        return x * x - y * y;
    }

    grad(w){
        const x = w[0], y = w[1];
        return [
            2 * x,
            -2 * y
        ]
    }
}

class BEALEFunc extends Func{
    constructor() {
        super("Beale function", [3, 0.5], [-1, 1], [-3, 3]);
    }

    val(w) {
        const x = w[0], y = w[1];
        return Math.pow(1.5 - x + x * y, 2) + Math.pow(2.25 - x + x * y * y, 2) + Math.pow(2.625 - x + x * Math.pow(y, 3), 2);
    }

    grad(w){
        const x = w[0], y = w[1],
              y2 = y * y,
              y3 = Math.pow(y, 3),
              y4 = Math.pow(y, 4),
              y5 = Math.pow(y, 5),
              y6 = Math.pow(y, 6);
        return [
            2 * x * (y6 + y4 - 2 * y3 - y2 - 2 * y + 3) + 5.25 * y3 + 4.5 * y2 + 3 * y - 12.75,
            6 * x * (x * (y5 + 2/3 * y3 - y2 - 1/3 * y - 1/3) + 2.625 * y2 + 1.5 * y + 0.5)
        ]
    }
}


class GradientDescent extends Animation {
    constructor (canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "gradient descent", "gradient-descent.js");
        this.func = new BEALEFunc();
        //this.func = new SaddlePointFunc();

        this.scale = 0;
        this.optims = null;
        this.imageData = null;
    }

    draw() {
        //if(this.imageData != null) this.ctx.putImageData(this.imageData, 0, 0);

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

        //this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        //
        // for (let i = 0; i < this.optims.length; ++i) {
        //     let x1, y1;
        //     let o = this.optims[i];
        //     [x1, y1] = o.getW();
        //
        //     this.ctx.fillStyle = this.colorsAlt[i];
        //     this.ctx.font = '12px sans-serif';
        //     let v = this.func.val([x1, y1]);
        //     this.ctx.fillText(o.constructor.name + ": " + v.toFixed(2), x1 * this.scale, -y1 * this.scale);
        // }
        //
        // this.ctx.resetTransform();

    }

    resize() {
        Utils.clear(this.ctx, "#FFFFFF");
        this.imageData = null;

        const width = this.ctx.canvas.width,
              height = this.ctx.canvas.height,
              centerX = width / 2,
              centerY = height / 2,
              range = this.func.getRange();
        this.scale = Math.min(width, height) / (range[1] - range[0]);

        // Add function name and text
        this.ctx.fillStyle = this.colors[0];
        this.ctx.font = '12px sans-serif';

        this.ctx.fillText(this.func.getName(), 40, 22)
        if(this.func.hasGlobalMin()) {
            const globalMin = this.func.getGlobalMin()
            this.ctx.fillText("f(x*) = " + this.func.val(globalMin) + ", at x* =  (" + globalMin[0] + ", " + globalMin[1] + ")", 40, 42);
            Utils.fillCircle(this.ctx, this.colors[0], centerX + globalMin[0] * this.scale, centerY + -globalMin[1] * this.scale, 2);
        }

        // Very simple approach to draw isolines
        let isobands = new Array(width * height);
        let isolines = [0, 0.125];
        let exp = 2;
        let plusVal = 0;

        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const x = (i - centerX) / this.scale, y = -(j - centerY) / this.scale,
                      val = this.func.val([x, y]),
                      idx = i + j * width;

                while(val > isolines[isolines.length - 1]) isolines.push(isolines[isolines.length - 1] * exp + plusVal);
                for(let k = 1; k < isolines.length; ++k) {
                    if(val < isolines[k]) {
                        isobands[idx] = k - 1;
                        break;
                    }
                }
            }
        }

        // Calculate colors for isolines
        let isolinesColors = []
        for(let i = 0; i < isolines.length; ++i){
            isolinesColors.push(Utils.lerpColor(this.colors[0], "#FFFFFF", (i + 1) / (isolines.length + 1)));
        }

        // TODO: use imageData instead of fillRect
        this.ctx.fillStyle = "#000000";
        for(let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                const idx = i + j * width;
                const sum = -3 * isobands[idx] + isobands[idx + 1] + isobands[idx + width] + isobands[idx + 1 + width];
                this.ctx.fillStyle = isolinesColors[isobands[idx]];
                if(sum != 0 && sum != 4) this.ctx.fillRect(i, j, 1, 1);
            }
        }

        // Add X axis
        for(let i = 0; i < centerX / this.scale; ++i){
            this.ctx.fillText(i.toFixed(1), centerX + i * this.scale, height - 22);
            if(i != 0) this.ctx.fillText((-i).toFixed(1), centerX - i * this.scale, height - 22);
        }

        // Add Y axis
        for(let i = 0; i < centerY / this.scale; ++i){
            this.ctx.fillText(i.toFixed(1), 10, centerY + i * this.scale);
            if(i != 0) this.ctx.fillText((-i).toFixed(1), 10, centerY - i * this.scale);
        }

        const start = this.func.getStartPoint();
        this.optims = [
            new SGD(start),
            new Momentum(start),
            new AdaGrad(start),
            new RMSProp(start),
            new Adam(start)
        ];
    }
}

module.exports = GradientDescent;
