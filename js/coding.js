'use strict';

const NAME = "Code writing animation",
      FILE = "coding.js",
      DESC = `
Work in progress.

Code writing animation inspired by: https://openprocessing.org/sketch/1219550
It's only light themed to match website colors, personally I always use dark IDE.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const Utils = require("./utils");

class Coding extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                charSize = 20,
                tabSize = 4) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);

        this.charSize = charSize;
        this.lineX = this.padding;
        this.lineY = this.padding;

        this.tabSize = tabSize;
        this.maxLines = 0;
        this.line = 0;
        this.tabs = 0;
        this.words = 0;
        this.wordLen = 0;

        this.editorTheme = { // Loosely based on Monokai Light theme
            keyword: "#33C5E1",
            typeName: "#F52D73",
            argument: "#F9A857",
            variable: "#030303",
            numericValue: "#B693FB",
            stringValue: "#F0763B",
            comment: "#737373",
        }

        this.firstWordColors = [this.editorTheme.keyword,
                                this.editorTheme.typeName,
                                this.editorTheme.variable,
                                this.editorTheme.comment];
        this.afterTypeName = [this.editorTheme.argument,
                              this.editorTheme.typeName,
                              this.editorTheme.variable];
        this.afterVariable = Utils.getValues(this.editorTheme);
        this.otherCases = [this.editorTheme.keyword,
                           this.editorTheme.typeName,
                           this.editorTheme.variable,
                           this.editorTheme.comment,
                           this.editorTheme.numericValue,
                           this.editorTheme.stringValue];

        this.currentColor = null;
        this.imageData = null;

        this.updateCharSize();
        this.newLine();
        this.newWord();
    }

    updateCharSize(){
        this.padding = this.charSize / 2;
        this.lineHeight = this.charSize * 1.25;
        this.charWidth = Math.ceil(this.charSize / 1.618);
        this.charHeight = this.charSize;
        this.imageData = null;
        this.line = 0;
        this.resize();
        this.newWord();
    }

    newWord(){
        // Some handcrafted rules for the next word's color to make it look more structured
        this.wordLen = 0;
        if(this.words === 0) this.currentColor = Utils.randomChoice(this.firstWordColors);
        else {
            if (this.currentColor === this.editorTheme.typeName)
                this.currentColor = Utils.randomChoice(this.afterTypeName);
            else if (this.currentColor === this.editorTheme.variable)
                this.currentColor = Utils.randomChoice(this.afterVariable);
            else if (this.currentColor === this.editorTheme.comment)
                this.currentColor = this.editorTheme.comment;
            else this.currentColor = Utils.randomChoice(this.otherCases);
        }
    }

    newLine(){
        if(this.line > this.maxLines){
            const shift = (this.maxLines - this.line) * this.lineHeight;
            this.clear();
            if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, shift);
            this.line = this.maxLines;
        }

        this.words = 0;
        this.lineX = this.padding + this.tabs * this.tabSize * this.charWidth;
        this.lineY = this.padding + this.line * this.lineHeight;
    }

    draw() {
        // Continue current word and write next "character"
        if(this.rand() < Math.pow(0.9, this.wordLen - 2) || this.wordLen < 3){
            this.lineX += this.charWidth;
            ++this.wordLen;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.fillRect(this.lineX, this.lineY, this.charWidth, this.charHeight);
        } else {
            if(this.rand() < Math.pow(0.5,this.words - 1) || this.words < 2) { // Continue line
                ++this.words;
                this.lineX += this.charWidth;
            } else { // New line
                const indentChoice = Utils.randomChoice(["inc", "inc", "dec", "dec", "keep", "keep", "reset", "keep+newline"]);
                if(indentChoice === "inc" && this.tabs < 4) ++this.tabs;
                else if(indentChoice === "keep+newline") ++this.line;
                else if(indentChoice === "dec" && this.tabs > 0) {
                    ++this.line;
                    --this.tabs;
                } else if(indentChoice === "reset" && this.tabs > 0){
                    ++this.line;
                    this.tabs = 0;
                }
                ++this.line;
                this.newLine();
            }
            this.newWord();
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize() {
        this.clear();
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);
        this.maxLines = Math.floor((this.ctx.canvas.height - 2 * this.padding) / this.lineHeight) - 1;
        this.newLine();
    }

    getSettings() {
        return [{prop: "charSize", type: "int", min: 8, max: 72, toCall: "updateCharSize"},
                {prop: "tabSize", type: "int", min: 1, max: 16}]
    }
}

module.exports = Coding;
