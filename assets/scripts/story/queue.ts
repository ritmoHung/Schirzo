export default class Queue<T> {
    private queue: T[];

    constructor() {
        this.queue = [];
    }

    push(element: T): void {
        this.queue.push(element);   
    }

    pop(): T | undefined {
        return this.queue.shift();
    }

    front(): T | undefined {
        return this.queue[0];
    }

    empty(): boolean {
        return this.queue.length === 0;
    }
    size(): number {
        return this.queue.length;
    } 
}