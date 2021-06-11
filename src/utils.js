module.exports = {

    randomRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomChoice: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    randomBoxMuller: function() {
        return Math.sqrt(-2.0 * Math.log( 1 - Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
    },

    randomArray: function(length, min, max){
        return Array(length).fill().map(() => this.randomRange(min, max))
    },

    clip: function(value, min, max){
        return Math.max(min, Math.min(max, value));
    },

    // Function to linearly interpolate between v1 and v2
    lerp: function(v1, v2, t) {
        return (1.0 - t) * v1 + t * v2;
    },

    clear(ctx, color){
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    },

    fillRect(ctx, color, x, y, w, h){

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
};
