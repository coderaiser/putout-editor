type LogFunction = (...args: unknown[]) => void;

export const log: {
    event: LogFunction;
    error: LogFunction;
} = {
    event: console.log.bind(console),
    error: console.log.bind(console),
};

export function logEvent(category: string, action: string, label: string): void {
    log.event(category, action, label);
}

export function logError(exDescription: string, exFatal?: boolean): void {
    log.error(exDescription, exFatal);
}
