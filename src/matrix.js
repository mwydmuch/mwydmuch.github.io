'use strict';

/*
 * Recreation of matrix digital rain based on this analysis
 * of the original effect: https://carlnewton.github.io/digital-rain-analysis/
 * I'm a huge fan of the first movie.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

class Matrix extends Animation {
    constructor(canvas, colors, colorsAlt,
                dropsSize = 20,
                dropsSpeed = 0.6,
                fadingSpeed = 0.01) {
        super(canvas, colors, colorsAlt, "Matrix digital rain", "matrix.js");
        this.dropsSize = dropsSize;
        this.dropsSpeed = dropsSpeed;
        this.fadingSpeed = fadingSpeed;

        this.flipProp = 0.25; // Probability of flipping a character
        this.errorProp = 0.1; // Probability of drawing character in different row

        this.cellWidth = 0;
        this.cellHeight = 0;
        this.columns = 0;
        this.columnHeight = 0;
        this.drops = [];
        
        this.imageData = null;

        const katakana = "ｦｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾜﾝ",
              katakanaSubset = "ﾊﾋｼﾂｳｰﾅﾐﾓﾆｻﾜｵﾘﾎﾏｴｷﾑﾃｹﾒｶﾕﾗｾﾈｽﾀﾇ",
              digits = "0123456789",
              latin = "ABCDEFGHIKLMNOPQRSTVXYZ",
              symbols = "*+:=.<>#@!?^~\"",
              oldItalic = "𐌀𐌁𐌂𐌃𐌄𐌅𐌆𐌇𐌈𐌉𐌊𐌋𐌌𐌍𐌎𐌏𐌐𐌑𐌒𐌓𐌔𐌕𐌖𐌗𐌘𐌙𐌚";

        this.characters = katakana + digits + symbols;
    }

    dropSpawnPoint(y){
        return Utils.randomInt(0, Math.min(y - 1, this.columnHeight / 2)) - 1;
    }

    dropDespawn(y){
        return (Math.random() < Math.pow(y / this.columnHeight, 2) * 0.1) || (y > this.columnHeight);
    }

    drawCharacter(char, cellX, cellY, color){
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(cellX - this.cellWidth/2, cellY, this.cellWidth, this.cellHeight);
        this.ctx.fillStyle = color;

        if(Math.random() < this.flipProp){ // Randomly flip character
            this.ctx.save();
            this.ctx.translate(cellX, cellY);
            this.ctx.scale(-1, 1);
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
        } else this.ctx.fillText(char, cellX, cellY);
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        this.ctx.font = `${this.dropsSize}px monospace`;
        this.ctx.textAlign = "center"; // This helps with aligning flipped characters
        this.ctx.textBaseline = "top"; // This nicely align characters in a cells

        for(let d of this.drops){
            if(Math.floor(d.y) !== Math.floor(d.y + this.dropsSpeed)){
                d.y += this.dropsSpeed;
                const cellX = d.x * this.cellWidth + this.cellWidth / 2,
                      cellY = Math.floor(d.y) * this.cellHeight;

                this.drawCharacter(d.char, cellX, cellY, this.colors[0]);

                d.char = Utils.randomChoice(this.characters);
                if(this.dropDespawn(d.y)) d.y = this.dropSpawnPoint(d.y);

                if(Math.random() < this.errorProp){
                    const yDiff = Utils.randomInt(-8, 8);
                    this.drawCharacter(Utils.randomChoice(this.characters), cellX, Math.floor(yDiff + d.y) * this.cellHeight, this.colors[0]);
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

    getSettings() {
        return [{prop: "dropsSize", type: "int", min: 8, max: 64, toCall: "resize"},
                {prop: "dropsSpeed", type: "float", min: 0, max: 1},
                {prop: "fadingSpeed", type: "float", step: 0.001, min: 0, max: 0.5}];
    }
}

module.exports = Matrix;
