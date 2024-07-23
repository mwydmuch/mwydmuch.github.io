'use strict';

const NAME = "glitch automata",
      FILE = "glitch-automata.js",
      DESC = `
The animation is a type of cellular automata that apply to the cell 
a state of one of the neighbor cells based on a noise function.
It reminds me the effect of glitching 

TODO

https://en.wikipedia.org/wiki/Error_diffusion

My other cellular automata visualizations:
- [Brain's brain](https://mwydmuch.pl/animations?animation=brains-brain-automata)
- [day and night automata](https://mwydmuch.pl/animations?animation=day-and-night-automata)
- [glitch automata](https://mwydmuch.pl/animations?animation=glitch-automata)
- [isometric game of life](https://mwydmuch.pl/animations?animation=game-of-life-isometric)
- [rock paper scissors](https://mwydmuch.pl/animations?animation=rock-paper-scissors-automata)
- [sand automata](https://mwydmuch.pl/animations?animation=sand-automata)

Coded with no external dependencies, using only canvas API.
`;

const GridAnimation = require("../grid-animation");
const Utils = require("../utils");

class GlitchAutomata extends GridAnimation {
    constructor(canvas, colors, colorsAlt, bgColor,
                cellSize = 7,
                initialPatern = "random",
                noiseScale = 0.0051) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
        this.cellSize = cellSize;
        this.noiseScale = noiseScale;
        
        this.initialPaterns = [
            "1x1 checkerboard", 
            "2x2 checkerboard", 
            "4x4 checkerboard", 
            "vertical lines", 
            "horizontal lines", 
            "photo"
        ];
        this.initialPatern = this.assignIfRandom(initialPatern, Utils.randomChoice(this.initialPaterns));
    }

    update(elapsed){
        //return 0;
        super.update(elapsed);

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const r = this.noise.simplex3(x * this.noiseScale, y * this.noiseScale, this.frame * this.noiseScale);
                const sw = Math.round(20 * r) % 5;
                const cellIdx = this.getIdx(x, y);
                switch (sw) {
                    case 0:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x - 1, y)]; // west
                        break
                    case 1:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x + 1, y)]; // east
                        break
                    case 2:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x, y - 1)]; // north
                        break
                    case 3:
                        this.gridNext[cellIdx] = this.grid[this.getIdxWrap(x, y + 1)]; // south
                        break
                    case 4:
                        this.gridNext[cellIdx] = this.grid[cellIdx]; // self
                }
            }
        }

        [this.grid, this.gridNext] = [this.gridNext, this.grid];
    }

    draw() {
        //return 0;
        this.clear();
        this.ctx.fillStyle = this.colors[0];
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                if(this.grid[this.getIdx(x, y)] > 0) this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }

    newCellState(x, y) {
        if(this.initialPatern == "1x1 checkerboard") return (x + y) % 2 ? 1 : 0;
        else if(this.initialPatern == "2x2 checkerboard"){
            const x2 = Math.floor(x / 2),
                  y2 = Math.floor(y / 2);
            return (x2 + y2) % 2 ? 1 : 0;
        } else if(this.initialPatern == "4x4 checkerboard"){
            const x2 = Math.floor(x / 4),
                  y2 = Math.floor(y / 4);
            return (x2 + y2) % 2 ? 1 : 0;
        } else if(this.initialPatern == "vertical lines") return x % 4 ? 0 : 1;
        else if(this.initialPatern == "horizontal lines") return y % 4 ? 0 : 1;
        else if(this.initialPatern == "random") return Math.round(Math.random());
        return 0;
    }

    setGridUsingImage(img){
        console.log("Image loaded");

        // Create a hidden canvas to draw the image, and get the image size
        const hiddenCanvas = new OffscreenCanvas(this.gridWidth, this.gridHeight),
              imgWidth = img.naturalWidth,
              imgHeight = img.naturalHeight;

        // Fit it into the visible canvas with the animation
        const scale = Math.min(this.gridWidth / imgWidth, this.gridHeight / imgHeight),
              scaledWidth = imgWidth * scale,
              scaledHeight = imgHeight * scale,
              hiddenCtx = hiddenCanvas.getContext("2d");
        hiddenCtx.drawImage(img, 
            (this.gridWidth - scaledWidth) / 2, 
            (this.gridHeight - scaledHeight) / 2,
            scaledWidth, scaledHeight);
        let imgData = hiddenCtx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
            
        console.log("Image processed");
        this.clear();
        //this.ctx.putImageData(imgData, 0, 0, this.gridWidth, this.gridHeight, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(imgData, 200, 200);

        // Apply error diffusion dithering to the image
        for (let i = 0; i < imgData.data.length; i += 4) {
            const r = imgData.data[i],
                  g = imgData.data[i + 1],
                  b = imgData.data[i + 2],
                  luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            imgData.data[i] = luma;
            imgData.data[i + 1] = luma;
            imgData.data[i + 2] = luma;
            this.grid[i / 4] = luma < 128 ? 1 : 0;
        }

        this.clear();
        this.ctx.fillStyle = this.colors[0];
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                if(this.grid[this.getIdx(x, y)] > 0) this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }

        this.ctx.putImageData(imgData, 200 + this.gridWidth, 200 + this.gridHeight);
    }

    restart(){
        if(this.initialPatern == "photo"){
            console.log("Restart... using");

            let img = new Image();
            let self = this;
            img.src = "./assets/marek-wydmuch.jpg";
            img.onload = function() {
                self.setGridUsingImage(img);
            }
        }
        else {
            this.gridWidth = 0;
            this.gridHeight = 0;
            super.restart();
        }
    }

    getSettings() {
        return [{prop: "cellSize", type: "int", min: 4, max: 12, toCall: "resize"},
                {prop: "initialPatern", type: "select", values: this.initialPaterns, toCall: "restart"},
                {prop: "noiseScale", type: "float", step: 0.0001, min: 0.001, max: 0.05},
                this.getSeedSettings()];
    }
}

module.exports = GlitchAutomata;
