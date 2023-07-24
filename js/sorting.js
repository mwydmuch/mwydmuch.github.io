'use strict';

const NAME = "sorting algorithm visualization",
      FILE = "sorting.js",
      DESC = `
Animated visualization of different sorting algorithms.

Coded with no external dependencies, using only canvas API.
`;

const Animation = require("./animation");
const AnimationQueue = require("./animation-queue");
const Utils = require("./utils");


// Base class for a sorting algorithm
class SortingAlgorithm {
    constructor(arr, name){
        this.arr = arr;
        this.moves = []
        this.cmpCount = 0;
        this.name = name;
        this.sort();
    }

    getName(){
        return this.name;
    }

    comp(arr, a, b){
        if(a !== b) {
            ++this.cmpCount;
            this.moves.push(["cmp", arr[a], arr[b]]);
        }
        return arr[a].val - arr[b].val;
    }

    compVal(a, b){
        if(a !== b){
            ++this.cmpCount;
            this.moves.push(["cmp", a, b]);
        }
        return a.val - b.val;
    }

    swap(arr, a, b){
        this.moves.push(["swap", [arr[a], arr[b]], [arr[b], arr[a]]]);
        let temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
    }

    rearrange(arr, a, b){
        let elA = [],
            elB = [];
        for(let i = 0; i < a.length; ++i){
            elA.push(this.arr[a[i]]);
            elB.push(this.arr[b[i]]);
        }
        for(let i = 0; i < a.length; ++i) arr[a[i]] = elB[i];
        this.moves.push(["swap", elB, elA]);
    }

    sort(){}

    getMoves(){
        return this.moves;
    }
}

class BubbleSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Bubble_sort
    constructor(arr) {
        super(arr, "bubble sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; ++i) {
            let sorted = true;
            for (let j = 0; j < n - 1 - i; ++j) {
                if (this.comp(this.arr, j, j + 1) > 0){
                    this.swap(this.arr, j, j + 1);
                    sorted = false;
                }
            }
            if(sorted) break;
        }
    }
}

class SelectionSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Selection_sort
    constructor(arr) {
        super(arr, "selection sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n; ++i) {
            let m = i;
            for (let j = i; j < n; ++j) if (this.comp(this.arr, m, j) > 0) m = j;
            if (i !== m) this.swap(this.arr, i, m);
        }
    }
}

class InsertionSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Insertion_sort
    constructor(arr) {
        super(arr, "insertion sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 1; i < n; ++i) {
            let j = i;
            while (j > 0 && this.comp(this.arr, j, j - 1) < 0) {
                this.swap(this.arr, j, j - 1);
                --j;
            }
        }
    }
}

class MergeSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Merge_sort
    constructor(arr) {
        super(arr, "merge sort");
    }

    sort(){
        this.mergeSort(0, this.arr.length - 1);
    }

    mergeSort(l, r){
        if (l < r) {
            const m = Math.floor((l + r) / 2);
            this.mergeSort(l, m);
            this.mergeSort(m + 1, r);
            this.merge(l, m, r);
        }
    }

    merge(s, m, e) {
        let l = s,
            r = m + 1;
        if (this.comp(this.arr, m, r) <= 0) return; // If already sorted

        let newOrder = [],
            oldOrder = [];
        for (let i = l; i <= e; ++i) oldOrder.push(i);
        while (l <= m && r <= e) {
            if(this.comp(this.arr, l, r) < 0) newOrder.push(l++);
            else newOrder.push(r++);
        }
        while (l <= m) newOrder.push(l++);
        while (r <= e) newOrder.push(r++);
        this.rearrange(this.arr, oldOrder, newOrder)
    }
}

class QuickSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Quicksort
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
        const p = this.arr[Math.floor((r + l) / 2)];
        while (l <= r) {
            while(this.compVal(this.arr[l], p) < 0) ++l;
            while(this.compVal(this.arr[r], p) > 0) --r;
            if (l <= r) this.swap(this.arr, l++, r--);
        }
        return l;
    }
}

class HeapSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Heapsort
    constructor(arr) {
        super(arr, "heap sort");
    }

    sort(){
        for (let i = Math.floor((this.arr.length - 1) / 2); i >= 0; --i) this.heapify(this.arr.length, i);

        for (let i = this.arr.length - 1; i > 0; --i) {
            this.swap(this.arr, 0, i);
            this.heapify(i, 0);
        }
    }

    heapify(n, i){
        let max = i,
            left = 2 * i + 1,
            right = 2 * i + 2;

        if (left < n && this.comp(this.arr, left, max) > 0) max = left;
        if (right < n && this.comp(this.arr, right, max) > 0) max = right;
        if (max !== i) {
            this.swap(this.arr, i, max);
            this.heapify(n, max);
        }
    }
}

class GnomeSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Gnome_sort
    constructor(arr) {
        super(arr, "gnome sort");
    }

    sort(){
        const n = this.arr.length;
        let pos = 0;
        while(pos < n){
            if(pos === 0 || this.comp(this.arr, pos, pos - 1) >= 0) ++pos;
            else{
                this.swap(this.arr, pos, pos - 1);
                --pos;
            }
        }
    }
}


class ShakerSort extends SortingAlgorithm{ // https://en.wikipedia.org/wiki/Cocktail_shaker_sort
    constructor(arr) {
        super(arr, "shaker sort");
    }

    sort(){
        const n = this.arr.length;
        for (let i = 0; i < n - 1; ++i) {
            let sorted = true;
            for (let j = 0; j < n - 1 - i; ++j) {
                if (this.comp(this.arr, j, j + 1) > 0){
                    this.swap(this.arr, j, j + 1);
                    sorted = false;
                }
            }
            if(sorted) break;

            sorted = true;
            for (let j = n - 2 - i; j > i ; --j) {
                if (this.comp(this.arr, j, j - 1) < 0){
                    this.swap(this.arr, j, j - 1);
                    sorted = false;
                }
            }
            if(sorted) break;
        }
    }
}


class Sorting extends Animation {
    constructor (canvas, colors, colorsAlt,
                 sortingAlgorithm = "random",
                 numElements = 96,
                 elementPadding = 2,
                 cmpDuration = 0.25,
                 swapDuration = 0.25,
                 speed = 1,
                 showStats = false) {
        super(canvas, colors, colorsAlt, NAME, FILE, DESC);

        this.numElements = numElements;
        this.elementPadding = elementPadding;
        this.cmpDuration = cmpDuration;
        this.swapDuration = swapDuration;
        this.speed = speed;
        this.showStats = showStats;

        this.sortAlgoNames = ["selection sort", "bubble sort", "insertion sort",
            "quick sort", "merge sort", "heap sort", "gnome sort", "shaker sort"];
        this.sortAlgoClasses = [SelectionSort, BubbleSort, InsertionSort,
            QuickSort, MergeSort, HeapSort, GnomeSort, ShakerSort];
        this.sortingAlgorithm = this.assignIfRandom(sortingAlgorithm, Utils.randomChoice(this.sortAlgoNames));

        this.initialOrderTypes = ["random", "sorted", "reverse sorted", "evens then odds"];
        this.initialOrder = "random";

        this.cmpTotal = 0;
        this.cmpCount = 0;

        this.setup();
    }

    setup(){
        const valMax = this.numElements;
        this.animQueue = new AnimationQueue();

        // Initial order of values
        let values = Array.from({length: valMax}, (x, i) => i + 1);

        if(this.initialOrder === "random") Utils.randomShuffle(values, this.rand);
        else if(this.initialOrder === "reverse sorted") values = values.reverse();
        else if(this.initialOrder === "evens then odds")
            values = values.sort((a, b) => (a % 2 + a / (valMax + 1) - (b % 2 + b / (valMax + 1))));

        // Create elements
        this.elements = [];
        for(let i = 0; i < valMax; ++i){
            const val = values[i] / valMax,
                  color = Utils.lerpColor(this.colors[0], this.colors[2], val);
            this.elements.push({val: val, pos: i, color: color, z: 0})
        }

        // Sort
        let sortAlgoCls = this.sortAlgoClasses[this.sortAlgoNames.indexOf(this.sortingAlgorithm)],
            sortAlgo = new sortAlgoCls(this.elements);
        this.moves = sortAlgo.getMoves();
        this.name = sortAlgo.getName() + " algorithm visualization";

        this.cmpTotal = sortAlgo.cmpCount;
        this.cmpCount = 0;

        // Validate sorting
        /*
        for(let i = 1; i < this.elements.length; ++i){
            if(this.elements[i - 1] > this.elements[i]){
                console.log("The array is not sorted, something went wrong!");
                break;
            }
        }
        */
    }

    update(elapsed){
        elapsed /= 1000;
        elapsed *= this.speed;
        this.time += elapsed;
        ++this.frame;

        while(this.animQueue.step(elapsed) > 0){
            if(!this.moves.length) return;

            let s = this.moves[0];
            const colorEasing = (x) => x < 0.5 ? Utils.easeInOutCubic(2 * x) : 1 - Utils.easeInOutCubic(2 * x - 1),
                  posEasing = Utils.easeInOutSine;

            if(s[0] === "cmp") {
                ++this.cmpCount;
                let e1 = s[1], e2 = s[2];
                const color1 = e1.color,
                      color2 = e2.color,
                      colorSel = this.colorsAlt[3],
                      duration = this.cmpDuration;

                this.animQueue.push(function (time) {
                    const prog = Math.min(time, duration) / duration;
                    e1.color = Utils.lerpColor(color1, colorSel, colorEasing(prog));
                    e2.color = Utils.lerpColor(color2, colorSel, colorEasing(prog));
                    return time - duration;
                });
            }
            else if(s[0] === "swap") {
                let e1 = s[1], e2 = s[2];
                let pos1 = [],
                    pos2 = [],
                    color = [];
                const colorSel = this.colorsAlt[1],
                      z = this.frame,
                      duration = this.swapDuration * e1.length;

                for(let i = 0; i < e1.length; ++i){
                    pos1.push(e1[i].pos);
                    pos2.push(e2[i].pos);
                    color.push(e1[i].color);
                }

                this.animQueue.push(function (time) {
                    const prog = Math.min(time, duration) / duration;
                    for(let i = 0; i < e1.length; ++i) {
                        e1[i].z = z;
                        e1[i].color = Utils.lerpColor(color[i], colorSel, colorEasing(prog));
                        e1[i].pos = Utils.lerp(pos1[i], pos2[i], posEasing(prog));
                    }
                    return time - duration;
                });
            }

            this.moves.shift();
        }
    }

    draw() {
        this.clear();

        const elementMaxHeight = this.ctx.canvas.height,
              elementWidth = this.ctx.canvas.width / this.numElements;

        this.elements = this.elements.sort((e1, e2) => e1.z - e2.z)
        for(let e of this.elements){
            const x = e.pos * elementWidth + this.elementPadding / 2,
                  y = e.val * elementMaxHeight;
            this.ctx.fillStyle = e.color;
            this.ctx.fillRect(x, 0, elementWidth - this.elementPadding, y);
        }

        if(this.showStats){
            this.resetFont();
            const lineHeight = 20;
            Utils.fillAndStrokeText(this.ctx, `Sorting algorithm: ${this.sortingAlgorithm}`, lineHeight, elementMaxHeight - 3 * lineHeight);
            Utils.fillAndStrokeText(this.ctx, `Number of elements: ${this.numElements}`, lineHeight, elementMaxHeight - 2 * lineHeight);
            Utils.fillAndStrokeText(this.ctx, `Number of elements comparisons: ${this.cmpCount} / ${this.cmpTotal}`, lineHeight, elementMaxHeight - lineHeight);
        }
    }

    restart() {
        super.restart();
        this.setup();
    }

    getSettings() {
        return [{prop: "initialOrder", type: "select", values: this.initialOrderTypes, toCall: "setup"},
                {prop: "sortingAlgorithm", type: "select", values: this.sortAlgoNames, toCall: "setup"},
                {prop: "numElements", type: "int", min: 8, max: 256, toCall: "setup"},
                {prop: "speed", type: "float", step: 0.25, min: 0.5, max: 8},
                {prop: "showStats", type: "bool"},
                this.getSeedSettings()];
    }
}

module.exports = Sorting;