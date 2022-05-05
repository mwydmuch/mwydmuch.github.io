//  Nice analysis of the effect: https://carlnewton.github.io/digital-rain-analysis/

const Animation = require("./../animation");
const Utils = require("./../utils");

class Matrix extends Animation {
    constructor(canvas, colors, colorsAlt, fadingSpeed = 0.01) {
        super(canvas, colors, colorsAlt, "Matrix digital rain", "matrix.js");
        this.cellWidth = 16;
        this.cellHeight = 20;
        this.fontSize = 20;
        this.columns = 0;
        this.columnHeight = 0;
        this.drops = [];
        this.fadingSpeed = fadingSpeed;
        this.speed = 0.6;
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
        return Utils.randomInt(0, Math.min(y - 1, this.columnHeight / 2));
    }

    dropDespawn(y){
        return (Math.random() < y / this.columnHeight * 0.1) || (y > this.columnHeight);
    }

    draw() {
        this.fadeOut(this.fadingSpeed);

        this.ctx.font = `${this.fontSize}px monospace`;
        //this.ctx.font = `${this.fontSize}px sans-serif`;

        for(let d of this.drops){
            if(Math.floor(d.y) !== Math.floor(d.y + this.speed)){
                d.y += this.speed;
                const charX = d.x * this.cellWidth,
                      charY = Math.floor(d.y) * this.cellHeight;

                this.ctx.fillStyle = this.bgColor;
                this.ctx.fillRect(charX, charY, this.cellWidth, this.cellHeight);
                this.ctx.fillStyle = this.colors[0];
                this.ctx.fillText(d.char, charX, charY);

                d.char = Utils.randomChoice(this.characters);
                if(this.dropDespawn(d.y)) d.y = this.dropSpawnPoint(d.y);
            }
            else d.y += this.speed;
        }

        this.imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize() {
        Utils.clear(this.ctx, this.bgColor);
        if(this.imageData !== null) this.ctx.putImageData(this.imageData, 0, 0);

        this.columns = this.ctx.canvas.width / this.cellWidth;
        this.columnHeight = this.ctx.canvas.height / this.cellHeight;
        if(this.drops.length < this.columns){
            for(let i = this.drops.length; i < this.columns; ++i){
                this.drops.push({char: Utils.randomChoice(this.characters), x: i, y: this.dropSpawnPoint(this.columnHeight)});
            }
        }
    }

    getSettings() {
        return [{
            prop: "cellWidth",
            type: "int",
            min: 12,
            max: 72,
            toCall: "resize",
        }, {
            prop: "cellHeight",
            type: "int",
            min: 12,
            max: 72,
            toCall: "resize",
        }, {
            prop: "fontSize",
            type: "int",
            min: 12,
            max: 72,
            toCall: "resize",
        }, {
            prop: "speed",
            type: "float",
            min: 0,
            max: 1,
        }, {
            prop: "fadingSpeed",
            type: "float",
            step: 0.001,
            min: 0,
            max: 0.5,
        }]
    }
}

module.exports = Matrix;
