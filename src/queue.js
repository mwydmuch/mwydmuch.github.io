'use strict';

/*
 * Simple and efficient implementation of a queue, with naive priority option
 * (the priority part is not efficient, but for animation purpose it doesn't have to).
 */

class Queue {
    constructor(initialCapacity = 32, priorityQueue = false, comperator = function(a, b){ return a.value < b.value; }) {
        this.array = new Array(initialCapacity);
        this.elemComperator = comperator;
        this.priorityQueue = priorityQueue;
        this.first = 0;
        this.size = 0;
    }

    getArrayIdx(idx){
        return (this.first + idx) % this.array.length;
    }

    push(elem){
        if (this.size === this.array.length) {
            let newArray = new Array(this.size * 2);
            for (let i = 0; i < this.size; i++) newArray[i] = this.array[(this.first + i) % this.size];
            this.first = 0;
            this.array = newArray;
        }

        this.array[this.getArrayIdx(this.size)] = elem;
        ++this.size;

        if(this.priorityQueue && this.size > 1){
            for(let i = this.size - 1; i >= 0; --i){
                let elemIdx = this.getArrayIdx(i);
                let nextIdx = this.getArrayIdx(i - 1);
                if(this.elemComperator(this.array[elemIdx], this.array[nextIdx]))
                    [this.array[elemIdx], this.array[nextIdx]] = [this.array[nextIdx], this.array[elemIdx]];
                else break;
            }
        }
    }

    pop(){
        if (this.size === 0) return null;
        this.size--;
        let elem = this.array[this.first];
        this.first = (this.first + 1) % this.array.length;
        return elem;
    }

    clear(){
        this.size = 0;
        this.first = 0;
    }
}

module.exports = Queue;
