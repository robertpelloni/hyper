export class Agent {
    private state: any;
    private listeners: Set<any>;
    private steeringQueue: any[];
    private followUpQueue: any[];

    constructor() {
        this.state = {};
        this.listeners = new Set();
        this.steeringQueue = [];
        this.followUpQueue = [];
    }

    public addListener(listener: any) {
        this.listeners.add(listener);
    }

    public removeListener(listener: any) {
        this.listeners.delete(listener);
    }
}