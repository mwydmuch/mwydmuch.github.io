// Simple class for managing animations
class AnimationQueue {
    constructor(){
        this.queue = [];
    }

    push(stepFunc){
        this.queue.push({step: stepFunc, time: 0});
    }

    step(elapsed){
        let timeLeft = elapsed;
        while(this.queue.length && timeLeft > 0){
            let e = this.queue[0];
            e.time += elapsed;
            timeLeft = e.step(e.time);
            if(timeLeft >= 0) this.queue.shift();
        }
        return timeLeft;
    }

    clear(){
        this.queue = [];
    }
}

module.exports = AnimationQueue;