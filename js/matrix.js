'use strict';

const NAME = "Matrix digital rain",
      FILE = "matrix.js",
      DESC = `
Recreation of matrix digital rain based on this analysis
of the original effect on this 
[website](https://carlnewton.github.io/digital-rain-analysis/).

I'm a huge fan of the first movie.

Coded with no external dependencies, using only canvas API.
`;


const Animation = require("./animation");
const Utils = require("./utils");

class Matrix extends Animation {
    constructor(canvas, colors, colorsAlt,
                dropsSize = 20,
                dropsSpeed = 0.6,
                fadingSpeed = 0.01,
                originalMatrixColors = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.dropsSize = dropsSize;
        this.dropsSpeed = dropsSpeed;
        this.fadingSpeed = fadingSpeed;
        this.originalMatrixColors = originalMatrixColors;

        this.flipProp = 0.25; // Probability of flipping a character
        this.errorProp = 0.1; // Probability of drawing character in different row

        this.cellWidth = 0;
        this.cellHeight = 0;
        this.columns = 0;
        this.columnHeight = 0;
        this.drops = [];
        this.textColor = null;
        this.imageData = null;
        this.setColors();

        const katakana = "ｦｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾜﾝ",
              katakanaSubset = "ﾊﾋｼﾂｳｰﾅﾐﾓﾆｻﾜｵﾘﾎﾏｴｷﾑﾃｹﾒｶﾕﾗｾﾈｽﾀﾇ",
              digits = "0123456789",
              latin = "ABCDEFGHIKLMNOPQRSTVXYZ",
              symbols = "*+:=.<>#@!?^~\"",
              oldItalic = "𐌀𐌁𐌂𐌃𐌄𐌅𐌆𐌇𐌈𐌉𐌊𐌋𐌌𐌍𐌎𐌏𐌐𐌑𐌒𐌓𐌔𐌕𐌖𐌗𐌘𐌙𐌚";

        this.characters = katakana + digits + symbols;
    }

    dropSpawnPoint(y){
        return Utils.randomInt(0, Math.min(y - 1, this.columnHeight / 2), this.rand) - 1;
    }

    dropDespawn(y){
        return (this.rand() < Math.pow(y / this.columnHeight, 2) * 0.1) || (y > this.columnHeight);
    }

    drawCharacter(char, cellX, cellY, color){
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(cellX - this.cellWidth/2, cellY, this.cellWidth, this.cellHeight);
        this.ctx.fillStyle = color;

        if(this.rand() < this.flipProp){ // Randomly flip character
            this.ctx.save();
            this.ctx.translate(cellX, cellY);
            this.ctx.scale(-1, 1);
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
        } else this.ctx.fillText(char, cellX, cellY);
    }

    setColors(){
        if(this.originalMatrixColors){
            this.bgColor = "#000000";
            this.textColor = "#00FF00";
        } else {
            this.bgColor = "#FFFFFF";
            this.textColor = this.colors[0];
        }
    }

    draw() {
        if(this.originalMatrixColors) this.blendColorAlpha(this.bgColor, this.fadingSpeed, "darken");
        else this.blendColorAlpha(this.bgColor, this.fadingSpeed, "lighter");

        this.ctx.font = `${this.dropsSize}px monospace`;
        this.ctx.textAlign = "center"; // This helps with aligning flipped characters
        this.ctx.textBaseline = "top"; // This nicely align characters in a cells

        for(let d of this.drops){
            if(Math.floor(d.y) !== Math.floor(d.y + this.dropsSpeed)){
                d.y += this.dropsSpeed;
                const cellX = d.x * this.cellWidth + this.cellWidth / 2,
                      cellY = Math.floor(d.y) * this.cellHeight;

                this.drawCharacter(d.char, cellX, cellY, this.textColor);

                d.char = Utils.randomChoice(this.characters);
                if(this.dropDespawn(d.y)) d.y = this.dropSpawnPoint(d.y);

                if(this.rand() < this.errorProp){
                    const yDiff = Utils.randomInt(-8, 8);
                    this.drawCharacter(Utils.randomChoice(this.characters), cellX, Math.floor(yDiff + d.y) * this.cellHeight, this.textColor);
                }
            }
            else d.y += this.dropsSpeed;
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize() {
        this.clear();
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

        this.cellHeight = this.dropsSize;
        this.cellWidth = Math.ceil(this.dropsSize / 1.618);

        this.columns = this.ctx.canvas.width / this.cellWidth;
        this.columnHeight = this.ctx.canvas.height / this.cellHeight;

        if(this.drops.length < this.columns){
            for(let i = this.drops.length; i < this.columns; ++i){
                this.drops.push({char: Utils.randomChoice(this.characters), x: i, y: this.dropSpawnPoint(this.columnHeight)});
            }
        }
    }

    restart(){
        this.drops = [];
        this.setColors();
        this.resize();
        this.clear();
    }

    getSettings() {
        return [{prop: "dropsSize", type: "int", min: 8, max: 64, toCall: "resize"},
                {prop: "dropsSpeed", type: "float", min: 0, max: 1},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.5},
                //this.getSeedSettings()
                //{prop: "originalMatrixColors", type: "bool", toCall: "restart"} // Not ready yet
            ];
    }
}

module.exports = Matrix;