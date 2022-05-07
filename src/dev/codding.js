/*
 * Code writing animation inspired by: https://openprocessing.org/sketch/1219550
 * It's only light themed to match website colors, personally I always use dark IDE.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./../animation");
const Utils = require("./../utils");

class Codding extends Animation {
    constructor(canvas, colors, colorsAlt) {
        super(canvas, colors, colorsAlt, "Codding animation", "codding.js");
        this.lineHeight = 26;
        this.padding = 10;
        this.lineX = this.padding;
        this.lineY = this.padding;
        this.charWidth = 14;
        this.charHeight = 20;
        this.wordLen = 0;
        this.words = 0;
        this.tabs = 0;
        this.tabSize = 4;
        this.maxLines = 0;
        this.line = 0;

        this.editorColors = { // Loosely based on Monokai Light theme
            keyword: "#33C5E1",
            typeName: "#F52D73",
            argument: "#F9A857",
            variable: "#030303",
            numericValue: "#B693FB",
            stringValue: "#F0763B",
            comment: "#737373",
        }

        this.editorColors = ["#33C5E1", "#F52D73", "#F9A857", "#030303", "#B693FB", "#F0763B", "#737373"];

        this.currentColor = Utils.randomChoice(this.editorColors);
        this.imageData = null;
    }

    updateLinePosition(){
        if(this.line > this.maxLines){
            const shift = (this.maxLines - this.line) * this.lineHeight;
            Utils.clear(this.ctx, this.bgColor);
            if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, shift);
            this.line = this.maxLines;
        }

        this.lineY = this.padding + this.line * this.lineHeight;
    }

    draw() {
        if(Math.random() < Math.pow(0.9, this.wordLen - 2) || this.wordLen < 3){ // Write next "character"
            this.lineX += this.charWidth;
            ++this.wordLen;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.fillRect(this.lineX, this.lineY, this.charWidth, this.charHeight);
        } else {
            if(Math.random() < Math.pow(0.5,this.words - 1) || this.words < 2) { // Space and word with new color
                ++this.words;
                this.lineX += this.charWidth;
                this.wordLen = 0;
                this.currentColor = Utils.randomChoice(this.editorColors);
            } else { // New line
                this.words = 0;
                this.wordLen = 0;

                const indentChoice = Utils.randomChoice(["inc", "inc", "dec", "dec", "keep", "keep", "reset", "keep+line"]);
                if(indentChoice === "inc" && this.tabs < 4) ++this.tabs;
                else if(indentChoice === "keep+line") ++this.line;
                else if(indentChoice === "dec" && this.tabs > 0) {
                    ++this.line;
                    --this.tabs;
                } else if(indentChoice === "reset" && this.tabs > 0){
                    ++this.line;
                    this.tabs = 0;
                }
                ++this.line;
                this.lineX = this.padding + this.tabs * this.tabSize * this.charWidth;

                this.updateLinePosition();
            }
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize() {
        Utils.clear(this.ctx, this.bgColor);
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);
        this.maxLines = Math.floor((this.ctx.canvas.height - 2 * this.padding) / this.lineHeight) - 1;
        this.updateLinePosition();
    }

    getSettings() {
        return [{prop: "charSize", type: "int", min: 8, max: 72}, {prop: "tabSize", type: "int", min: 1, max: 16}]
    }
}

module.exports = Codding;
