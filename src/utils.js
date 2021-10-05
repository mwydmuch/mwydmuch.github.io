module.exports = {

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    randomBoxMuller() {
        return Math.sqrt(-2.0 * Math.log( 1 - Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
    },

    randomArray(length, min, max){
        return Array(length).fill().map(() => this.randomRange(min, max))
    },

    clip(value, min, max){
        return Math.max(min, Math.min(max, value));
    },

    remap(val, min1, max1, min2, max2){
        const range1 = max1 - min1,
              range2 = max2 - min2;
        return min2 + (val - min1) / range1 * range2;
    },

    // Function to linearly interpolate between v1 and v2
    lerp(v1, v2, t) {
        return (1.0 - t) * v1 + t * v2;
    },

    // Based on: https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
    lerpColor(a, b, t) {
        const ah = parseInt(a.replace('#', '0x'), 16);
              ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
              bh = parseInt(b.replace('#', '0x'), 16),
              br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,

              rr = ar + t * (br - ar),
              rg = ag + t * (bg - ag),
              rb = ab + t * (bb - ab);

        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    },

    clear(ctx, color){
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    },

    pathLine(ctx, x1, y1, x2, y2){
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    },

    drawLine(ctx, x1, y1, x2, y2, color, width = 1){
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    },

    pathPolygon(ctx, x, y, radius, sides, rotation = 0){
        const angle = 2 * Math.PI / sides;
        ctx.moveTo(x + radius * Math.cos(rotation), y + radius * Math.sin(rotation));
        for (let i = 1; i <= sides; i++) {
            ctx.lineTo(x + radius * Math.cos(rotation + i * angle), y + radius * Math.sin(rotation + i * angle));
        }
    },

    pathCircle(ctx, x, y, radius){
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    },

    fillCircle(ctx, color, x, y, radius){
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
    },

    strokeCircle(ctx, color, x, y, radius){
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.stroke();
    },

    blendColor(ctx, color, alpha = 1.0, globalCompositeOperation = 'source-over'){
        ctx.save();
        ctx.globalCompositeOperation = globalCompositeOperation;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    },

    createVec(x, y){
        return {x: x, y: y};
    },

    rotateVec(vec, r){
        const cos = Math.cos(r), sin = Math.sin(r);
        return {x: vec.x * cos - vec.y * sin, y: vec.x * sin + vec.y * cos};
    },

    isStrictMode(){
        return ((eval("var __temp = null"), (typeof __temp === "undefined")) ? "strict":  "non-strict");
    }
};
