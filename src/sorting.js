/*
 * Visualization of swaps for in-place sorting algorithms.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");


class AnimationQueue {
    constructor(){
        this.queue = [];
    }

    push(stepFunc){
        this.queue.push({step: stepFunc, time: 0});
    }

    step(elapsed){
        let finished = true;
        if(this.queue.length){
            let e = this.queue[0];
            e.time += elapsed;
            finished = e.step(e.time);
            if(finished) this.queue.shift();
        }
        return (finished && !this.queue.length)
    }
}

class SortingAlgorithm {
    constructor(arr, name){
        this.arr = arr;
        this.swaps = []
        this.name = name;
        this.sort();
    }

    getName(){
        return this.name;
    }

    swap(arr, a, b){
        this.swaps.push([arr[a], arr[b]]);
        let temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
    }

    sort(){}

    getSwaps(){
        return this.swaps;
    }
}

class BubbleSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "Bubble sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n - 1 - i; j++) {
                if (this.arr[j].val > this.arr[j + 1].val) this.swap(this.arr, j, j + 1);
            }
        }
    }
}

class SelectionSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "Selection sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; i++) {
            let m = i;
            for (let j = i; j < n; j++) if (this.arr[m].val > this.arr[j].val) m = j;
            if (i !== m) this.swap(this.arr, i, m);
        }
    }
}

class QuickSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "Quick sort");
    }

    sort(){
        this.quickSort(0, this.arr.length - 1);
    }

    quickSort(l, r){
        if (r - l >= 1) {
            const p = this.partition(l, r);
            if (l < p - 1) this.quickSort(l, p - 1);
            if (p < r) this.quickSort(p, r);
        }
    }

    partition(l, r) {
        const p = this.arr[Math.floor((r + l) / 2)];
        while (l <= r) {
            while (this.arr[l].val < p.val) l++;
            while (this.arr[r].val > p.val) r--;
            if (l <= r) this.swap(this.arr, l++, r--);
        }
        return l;
    }
}


class Sorting extends Animation {
    constructor (canvas, colors, colorsAlt, elementPadding = 2, swapDuration = 1.0) {
        super(canvas, colors, colorsAlt, "Sorting algorithm visualization", "sorting.js");
        this.numElements = 100;
        this.elementPadding = elementPadding;
        this.elementWidth = 0;
        this.elementMaxHeight = 0;
        this.swapDuration = swapDuration;
        this.animQueue = new AnimationQueue();

        // Randomize elements
        this.elements = [];
        for(let i = 0; i < this.numElements; ++i){
            const val = Utils.randomRange(0, 1),
                color = Utils.lerpColor(this.colors[0], this.colors[this.colors.length - 1], val);
            this.elements.push({val: val, pos: i, color: color, z: 0})
        }

        // Sort
        let sortAlgClass = Utils.randomChoice([BubbleSort, SelectionSort, QuickSort]),
            sortAlg = new sortAlgClass(this.elements)
        this.swaps = sortAlg.getSwaps();
        this.name = sortAlg.getName() + " algorithm visualization";
    }

    update(elapsed){
        elapsed /= 1000
        this.time += elapsed;
        ++this.frame;

        if(this.animQueue.step(elapsed)){
            if(!this.swaps.length) return;

            let s = this.swaps[0];

            const pos1 = s[0].pos,
                  pos2 = s[1].pos,
                  color1 = s[0].color,
                  color2 = s[1].color,
                  colorSel = this.colorsAlt[0],
                  duration = this.swapDuration,
                  z = this.frame,
                  easingFunc = Utils.easeInOutSine;

            this.animQueue.push(function(time){
                const prog = Math.min(time, duration) / duration;

                s[0].z = z;
                s[1].z = z;
                s[0].color = Utils.lerpColor(color1,
                    Utils.lerpColor(colorSel, color1,
                        Math.max(Utils.remap(prog, 0.9, 1, 0, 1), 0)),
                    Math.min(Utils.remap(prog, 0, 0.1, 0, 1), 1));
                s[1].color = Utils.lerpColor(color2,
                    Utils.lerpColor(colorSel, color2,
                        Math.max(Utils.remap(prog, 0.9, 1, 0, 1), 0)),
                    Math.min(Utils.remap(prog, 0, 0.1, 0, 1), 1));
                s[0].pos = Utils.lerp(pos1, pos2, easingFunc(prog));
                s[1].pos = Utils.lerp(pos2, pos1, easingFunc(prog));
                return time >= duration;
            });

            this.swaps.shift();
        }
    }

    draw() {
        Utils.clear(this.ctx, "#FFFFFF");

        this.elements = this.elements.sort((e1, e2) => e1.z - e2.z)
        for(let e of this.elements){
            const x = e.pos * this.elementWidth + this.elementPadding / 2,
                  y = e.val * this.elementMaxHeight;
            this.ctx.fillStyle = e.color;
            this.ctx.fillRect(x, 0, this.elementWidth - this.elementPadding, y);
        }
    }

    resize(){
        this.elementMaxHeight = this.ctx.canvas.height;
        this.elementWidth = this.ctx.canvas.width / this.numElements;
    }
}

module.exports = Sorting;
