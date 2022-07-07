import {flagRateLimit} from '../../../GlobalVars';

type FlagQueueEntry = () => Promise<void>;

class FlagQueue {
    private readonly queue: FlagQueueEntry[];
    private readonly queueDelay: number;
    private handlerIsActive: boolean;

    constructor(queueDelay: number) {
        this.queue = [];
        this.queueDelay = queueDelay; // in ms
        this.handlerIsActive = false;
    }

    enqueue = (cb: FlagQueueEntry) => {
        this.queue.push(cb);
        // Prevents multiple instances of handleQueue from running
        if (!this.handlerIsActive) {
            this.handlerIsActive = true;
            void this.handleQueue();
        }
    };

    handleQueue = async () => {
        if (this.queue.length > 0) {
            this.handlerIsActive = true;
            const cb = this.queue.shift();
            if (cb !== undefined) {
                await cb();
                setTimeout(() => {
                    this.handlerIsActive = true;
                    void this.handleQueue();
                }, this.queueDelay);
            }
        } else {
            this.handlerIsActive = false;
        }

    };
}

const globalFlagQueue = new FlagQueue(flagRateLimit);
Object.freeze(FlagQueue);

export default globalFlagQueue;