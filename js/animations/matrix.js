'use strict';

const NAME = "Matrix digital rain",
      FILE = "matrix.js",
      DESC = `
Recreation of matrix digital rain based on this analysis
of the original effect on this 
[website](https://carlnewton.github.io/digital-rain-analysis/).

I'm a huge fan of the first movie.

Coded by me (Marek Wydmuch) in 2022, with no external dependencies, using only canvas API.
`;


const Animation = require("../animation");
const Utils = require("../utils");

class Matrix extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                dropsSize = 20,
                dropsSpeed = 0.6,
                fadingSpeed = 0.01,
                glowEffect = true) {
        super(canvas, colors, colorsAlt, bgColor, NAME, FILE, DESC);
              //"random", "2d", { alpha: false, willReadFrequently: true }); 
              // Suggested by Chrome for frequent getImageData, but actually hurts performance.

        this.dropsSize = dropsSize;
        this.dropsSpeed = dropsSpeed;
        this.fadingSpeed = fadingSpeed;
        this.glowEffect = glowEffect;

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
        
        // Prerender characters for better performance on Chrome
        this.renderedCharacters = [];
        this.prerenderCharacters();
        this.usePrerenderElements = true;
    }

    setTextSetting(ctx){
        ctx.font = `${this.dropsSize}px monospace`;
        ctx.textAlign = "center"; // This helps with aligning flipped characters
        ctx.textBaseline = "top"; // This nicely align characters in a cells
    }

    prerenderCharacter(char, flip){
        const blurSize = Math.ceil(this.dropsSize / 10);
        let offCtx = new OffscreenCanvas(this.cellWidth + 2 * blurSize, this.cellHeight + 2 * blurSize).getContext('2d', { alpha: true });
        this.setTextSetting(offCtx);
        this.drawCharacterCell(offCtx, char, this.cellWidth/2 + blurSize, blurSize, flip, false, false);
        this.renderedCharacters.push(offCtx.canvas);
    }

    prerenderCharacters(){
        this.renderedCharacters = [];

        for(let i = 0; i < this.characters.length; ++i){
            this.prerenderCharacter(this.characters[i], false);
            this.prerenderCharacter(this.characters[i], true);
        }
    }

    dropSpawnPoint(y){
        return Utils.randomInt(0, Math.min(y - 1, this.columnHeight / 2), this.rand) - 1;
    }

    dropDespawn(y){
        return (this.rand() < Math.pow(y / this.columnHeight, 2) * 0.1) || (y > this.columnHeight);
    }

    drawCharacter(ctx, char, x, y){
        ctx.fillStyle = this.colors[0];
        if(this.glowEffect){
            ctx.filter = `blur(${this.dropsSize / 10}px)`;
            ctx.fillText(char, x, y);
            ctx.filter = "blur(0)";
            ctx.fillStyle = this.colors[1];
        }
        ctx.fillText(char, x, y);
    }

    drawCharacterCell(ctx, char, cellX, cellY, flip, fillBg=true, usePrerender=true){
        if(fillBg){
            ctx.fillStyle = this.bgColor;
            ctx.fillRect(cellX - this.cellWidth/2, cellY, this.cellWidth, this.cellHeight);
        }

        if(usePrerender){
            const blurSize = Math.ceil(this.dropsSize / 10);
            let charIdx = this.characters.indexOf(char) * 2;
            if(flip) ++charIdx;
            ctx.drawImage(this.renderedCharacters[charIdx], cellX - this.cellWidth/2 - blurSize, cellY - blurSize);
        } else {
            if(flip){
                ctx.save();
                ctx.translate(cellX, cellY);
                ctx.scale(-1, 1);
                this.drawCharacter(ctx, char, 0, 0);
                ctx.restore();
            } else this.drawCharacter(ctx, char, cellX, cellY);
        }
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        this.setTextSetting(this.ctx);

        for(let d of this.drops){
            if(Math.floor(d.y) !== Math.floor(d.y + this.dropsSpeed)){
                d.y += this.dropsSpeed;
                const cellX = d.x * this.cellWidth + this.cellWidth / 2,
                      cellY = Math.floor(d.y) * this.cellHeight;

                this.drawCharacterCell(this.ctx, d.char, cellX, cellY, this.rand() < this.flipProp, true, this.usePrerenderElements);

                d.char = Utils.randomChoice(this.characters, this.rand);
                if(this.dropDespawn(d.y)) d.y = this.dropSpawnPoint(d.y);

                if(this.rand() < this.errorProp){
                    const yDiff = Utils.randomInt(-8, 8, this.rand);
                    this.drawCharacterCell(this.ctx, Utils.randomChoice(this.characters, this.rand), 
                                           cellX, Math.floor(yDiff + d.y) * this.cellHeight, 
                                           this.rand() < this.flipProp, true, this.usePrerenderElements);
                }
            }
            else d.y += this.dropsSpeed;
        }

        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    resize() {
        this.clear();
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

        this.cellHeight = this.dropsSize;
        this.cellWidth = Math.ceil(this.dropsSize / 1.618);

        this.columns = this.canvas.width / this.cellWidth;
        this.columnHeight = this.canvas.height / this.cellHeight;

        if(this.drops.length < this.columns){
            for(let i = this.drops.length; i < this.columns; ++i){
                this.drops.push({char: Utils.randomChoice(this.characters, this.rand), x: i, y: this.dropSpawnPoint(this.columnHeight)});
            }
        }

        this.prerenderCharacters();
    }

    restart(){
        this.drops = [];
        super.restart();
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.prerenderCharacters();
        this.restart();
    }

    getSettings() {
        return [{prop: "dropsSize", type: "int", min: 8, max: 64, toCall: "resize"},
                {prop: "dropsSpeed", type: "float", min: 0, max: 1},
                {prop: "fadingSpeed", type: "float", step: 0.01, min: 0, max: 0.15},
                {prop: "glowEffect", icon: '<i class="fa-solid fa-lightbulb"></i>', type: "bool", toCall: "prerenderCharacters"},
                // {prop: "usePrerenderElements", type: "bool"},
                this.getSeedSettings()
            ];
    }
}

module.exports = Matrix;
