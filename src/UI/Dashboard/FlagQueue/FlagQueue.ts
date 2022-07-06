type FlagQueueEntry = () => Promise<void>;

class FlagQueue {
    private readonly queue: FlagQueueEntry[];
    private readonly flagRateLimit: number;
    private handlerIsActive: boolean;

    constructor(flagRateLimit: number) {
        this.queue = [];
        this.flagRateLimit = flagRateLimit; // in ms
        this.handlerIsActive = false;
    }

    enqueue = (cb: FlagQueueEntry) => {
        this.queue.push(cb);
        // Prevents multiple instances of handleQueue from running
        if (!this.handlerIsActive) {
            this.handlerIsActive = true;
            this.handleQueue();
        }
    };

    handleQueue = () => {
        if (this.queue.length > 0) {
            this.handlerIsActive = true;
            const cb = this.queue.shift();
            if (cb !== undefined) {
                cb().finally(() => {
                    this.handlerIsActive = true;
                    setTimeout(() => {
                        this.handleQueue();
                    }, this.flagRateLimit);
                });
            }
        } else {
            this.handlerIsActive = false;
        }

    };
}

const globalFlagQueue = Object.freeze(new FlagQueue(5000 + 650));

export default globalFlagQueue;