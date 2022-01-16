/*
 * Visualization of different sorting algorithms.
 *
 * Coded with no external dependencies, using only canvas API.
 */

const Animation = require("./animation");
const Utils = require("./utils");

// Simple class for managing animations
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

// Base class for a sorting algorithm
class SortingAlgorithm {
    constructor(arr, name){
        this.arr = arr;
        this.moves = []
        this.name = name;
        this.sort();
    }

    getName(){
        return this.name;
    }

    comp(arr, a, b){
        if(a != b) this.moves.push(["cmp", arr[a], arr[b]]);
        return arr[a].val - arr[b].val;
    }

    swap(arr, a, b){
        this.moves.push(["swap", arr[a], arr[b]]);
        let temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
    }

    sort(){}

    getMoves(){
        return this.moves;
    }
}

class BubbleSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "bubble sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n - 1 - i; j++) {
                if (this.comp(this.arr, j, j + 1) > 0) this.swap(this.arr, j, j + 1);
            }
        }
    }
}

class SelectionSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "selection sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; i++) {
            let m = i;
            for (let j = i; j < n; j++) if (this.comp(this.arr, m, j) > 0) m = j;
            if (i !== m) this.swap(this.arr, i, m);
        }
    }
}

class InsertionSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "insertion sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 1; i < n; i++) {
            let j = i;
            while (j > 0 && this.comp(this.arr, j, j - 1) < 0) {
                this.swap(this.arr, j, j - 1);
                --j;
            }
        }
    }
}

// class MergeSort extends SortingAlgorithm{
//     constructor(arr, comp) {
//         super(arr, "Merge sort");
//     }
//
//     sort(){
//         this.mergeSort(0, this.arr.length - 1);
//     }
//
//     mergeSort(l, r){
//         if (l < r) {
//             const m = Math.floor((l + r) / 2);
//             this.mergeSort(l, m);
//             this.mergeSort(m + 1, r);
//             this.merge(l, m, r);
//         }
//     }
//
//     merge(s, m, e) {
//         let l = s,
//             r = m + 1;
//         if (this.arr[m].val <= this.arr[r].val) return; // If already sorted
//
//         let tmpArr = [];
//         while (l <= m && r <= e) {
//             if(this.arr[l].val < this.arr[r].val) tmpArr.push(l++);
//             else tmpArr.push(r++);
//         }
//     }
// }

class QuickSort extends SortingAlgorithm{
    constructor(arr) {
        super(arr, "quick sort");
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
        const p = Math.floor((r + l) / 2);
        while (l <= r) {
            while(this.comp(this.arr, l, p) < 0) l++;
            while(this.comp(this.arr, r, p) > 0) r--;
            if (l <= r) this.swap(this.arr, l++, r--);
        }
        return l;
    }
}


class Sorting extends Animation {
    constructor (canvas, colors, colorsAlt, elementPadding = 2, stepDuration = 0.5) {
        super(canvas, colors, colorsAlt, "Sorting algorithm visualization", "sorting.js");
        this.numElements = 50;
        this.elementPadding = elementPadding;
        this.elementWidth = 0;
        this.elementMaxHeight = 0;
        this.stepDuration = stepDuration;
        this.animQueue = new AnimationQueue();

        // Randomize elements
        this.elements = [];
        for(let i = 0; i < this.numElements; ++i){
            const val = Utils.randomRange(0, 1),
                color = Utils.lerpColor(this.colors[0], this.colors[this.colors.length - 1], val);
            this.elements.push({val: val, pos: i, color: color, z: 0})
        }

        // Sort
        let sortAlgClass = Utils.randomChoice([BubbleSort, SelectionSort, InsertionSort, QuickSort]),
            sortAlg = new sortAlgClass(this.elements)
        this.moves = sortAlg.getMoves();
        this.name = sortAlg.getName() + " algorithm visualization";

        console.log(this.elements);
    }

    update(elapsed){
        elapsed /= 1000
        this.time += elapsed;
        ++this.frame;

        if(this.animQueue.step(elapsed)){
            if(!this.moves.length) return;

            let s = this.moves[0];
            const colorEasing = (x) => -(Math.cos(2 * Math.PI * x) - 1) / 2,
                  posEasing = Utils.easeInOutSine,
                  duration = this.stepDuration;


            if(s[0] == "swap") {
                let e1 = s[1], e2 = s[2];
                const pos1 = e1.pos,
                      pos2 = e2.pos,
                      color1 = e1.color,
                      color2 = e2.color,
                      colorSel = this.colorsAlt[1],
                      z = this.frame;


                this.animQueue.push(function (time) {
                    const prog = Math.min(time, duration) / duration;

                    e1.z = z;
                    e2.z = z;
                    e1.color = Utils.lerpColor(color1, colorSel, colorEasing(prog));
                    e2.color = Utils.lerpColor(color2, colorSel, colorEasing(prog));
                    e1.pos = Utils.lerp(pos1, pos2, posEasing(prog));
                    e2.pos = Utils.lerp(pos2, pos1, posEasing(prog));
                    return time >= duration;
                });
            }

            if(s[0] == "cmp") {
                let e1 = s[1], e2 = s[2];
                const color1 = e1.color,
                      color2 = e2.color,
                      colorSel = this.colorsAlt[5];

                this.animQueue.push(function (time) {
                    const prog = Math.min(time, duration) / duration;
                    e1.color = Utils.lerpColor(color1, colorSel, colorEasing(prog));
                    e2.color = Utils.lerpColor(color2, colorSel, colorEasing(prog));
                    return time >= duration;
                });
            }

            this.moves.shift();
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
