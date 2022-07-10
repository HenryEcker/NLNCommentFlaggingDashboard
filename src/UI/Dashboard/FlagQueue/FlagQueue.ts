import {flagRateLimit} from '../../../GlobalVars';

type FlagQueueEntry = () => Promise<void>;

class FlagQueue {
    private readonly queue: FlagQueueEntry[];
    private readonly queueDelayInSeconds: number;
    private handlerIsActive: boolean;

    constructor(queueDelay: number) {
        this.queue = [];
        this.queueDelayInSeconds = queueDelay; // in seconds
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
                const nextTime = new Date();
                // setSeconds does wrap appropriately
                nextTime.setSeconds(nextTime.getSeconds() + this.queueDelayInSeconds);
                setTimeout(() => {
                        this.handlerIsActive = true;
                        void this.handleQueue();
                    },
                    Math.max(
                        nextTime.getTime() - new Date().getTime(), // Calculate the distance to next run time
                        50 // (ensure minimum delay in case bad things happen)
                    )
                );
            }
        } else {
            this.handlerIsActive = false;
        }

    };
}

const globalFlagQueue = new FlagQueue(flagRateLimit);
Object.freeze(FlagQueue);

export default globalFlagQueue;