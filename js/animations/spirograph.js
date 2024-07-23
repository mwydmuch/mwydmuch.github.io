'use strict';

const NAME = "spirograph",
      FILE = "spirograph.js",
      DESC = `
Virtual spirograph created with 2-5 configurable gears.
Spirograph is a drawing toy that use gears to create patterns. I used to play with it a lot as a kid.

You can read about in on
[Wikipedia](https://en.wikipedia.org/wiki/Spirograph).
I also recommend to check this awesome [website] (http://www.eddaardvark.co.uk/v2/spirograph/spirograph2.html),
which is the source of inspiration for this animation.
And also this great [blogpost](https://www.bit-101.com/blog/2022/12/coding-curves-09-roulette-curves/)
that step by step how it works.

Try play with the gears' settings or hit reset button few times 
to get different random configurations.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("../animation");
const Utils = require("../utils");

class Spirograph extends Animation {
    constructor (canvas, colors, colorsAlt, bgColor, 
                 vertices = 4000, 
                 lineLength = 2, 
                 gearCount = "random",
                 rescaleToFit = true,
                 scale = 1,
                 rainbowColors = false) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.vertices = vertices;
        this.lineLength = lineLength;
        this.maxGears = 5;
        this.rescaleToFit = rescaleToFit;
        this.scale = scale;
        this.speed = 1;
        this.rainbowColors = rainbowColors;

        this.gearCount = this.assignIfRandom(gearCount, Utils.randomInt(2, this.maxGears));
        this.gearNames = ["zero", "one", "two", "three", "four", "five"];
        this.updateName();
        this.setup();
    }

    setup(){
        this.gears = [];
        for (let i = 0; i < this.maxGears; ++i) {
            this.gears.push({
                radius: Utils.round(Utils.randomRange(0, 100), 2),
                rate: Utils.round(Utils.randomRange(-100, 100), 2),
                phase: i * 0.005
            });
        }
    }

    updateName(){
        this.name = "spirograph with " + this.gearNames[this.gearCount] + " gears";
    }

    getXY(i, j, scale = 1){
        let x = 0, y = 0;

        for(let k = 0; k < this.gearCount; ++k){
            const g = this.gears[k];
            x += g.radius * scale * Math.cos(g.rate * (i + j * g.phase));
            y += g.radius * scale * Math.sin(g.rate * (i + j * g.phase));
        }

        return {x: x, y: y}
    }

    draw() {
        this.clear();

        let scale = 1;

        // Normalize size to fit the screen nicely
        if(this.rescaleToFit){
            let totalRadius = 0;
            for(let i = 0; i < this.gearCount; ++i) totalRadius += this.gears[i].radius;
            scale = Math.min(this.canvas.width, this.canvas.height) / 2 / totalRadius;
        }

        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);

        const length = Math.PI * this.lineLength,
              lenPerVertex = length / this.vertices;

        let start = this.getXY(0, this.time, scale);
        for (let i = 1; i < this.vertices; ++i) {
            let next = this.getXY(i * lenPerVertex, this.time, scale);
            let color = null;
            if(this.rainbowColors) color = 'hsl(' + i / this.vertices * 360 + ', 100%, 75%)';
            else color = Utils.lerpColor(this.colorA, this.colorB, i / this.vertices);
            Utils.drawLine(this.ctx, start.x, start.y, next.x, next.y, 1, color);
            start = next;
        }

        this.ctx.resetTransform();
    }

    getSettings() {
        let settings = [{prop: "vertices", icon: '<i class="fa-solid fa-draw-polygon"></i>', type: "int", min: 100, max: 32000},
                        {prop: "lineLength", icon: '<i class="fa-solid fa-ruler"></i>', type: "float", step: 0.25, min: 1, max: 16},
                        {prop: "gearCount", icon: '<i class="fa-solid fa-gears"></i>', type: "int", min: 2, max: this.maxGears, toCall: "updateName"},
                        {prop: "rescaleToFit", icon: '<i class="fa-solid fa-expand"></i>', type: "bool"},
                        {prop: "scale", icon: '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>', type: "float", min: 0.25, max: 4},
                        {prop: "speed", icon: '<i class="fa-solid fa-gauge-high"></i>', type: "float", step: 0.1, min: -4, max: 4},
                        {prop: "rainbowColors", icon: '<i class="fa-solid fa-rainbow"></i>', type: "bool"},
                        {type: "separator"}];
        for(let i = 0; i < this.maxGears; ++i){
            settings = settings.concat([{prop: `gears[${i}].radius`, icon: '<i class="fa-solid fa-gear"></i>', type: "float", step: 0.01, min: 0, max: 100},
                                        {prop: `gears[${i}].rate`, icon: '<i class="fa-solid fa-gear"></i>', type: "float", step: 0.01, min: -100, max: 100},
                                        {prop: `gears[${i}].phase`, icon: '<i class="fa-solid fa-gear"></i>', type: "float", step: 0.001, min: -0.1, max: 0.1}]);
        }
        return settings;
    }
}

module.exports = Spirograph
