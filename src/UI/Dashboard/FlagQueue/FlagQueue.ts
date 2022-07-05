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
                    // Rate Limit is from Flag _response_
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

const globalFlagQueue = new FlagQueue(5000 + 450);
Object.freeze(FlagQueue);

export default globalFlagQueue;