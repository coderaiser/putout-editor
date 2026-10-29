type LogFunction = (...args: unknown[]) => void;

type LogTarget = Pick<Console, 'log' | 'error'>;

type Log = {
    event: LogFunction;
    error: LogFunction;
};

export const createLog = (target: LogTarget = console): Log => ({
    event(...args) {
        target.log(...args);
    },
    error(...args) {
        target.error(...args);
    },
});

export const log = createLog();

export function logEvent(category: string, action: string, label = ''): void {
    log.event(category, action, label);
}

export function logError(exDescription: string, exFatal?: boolean): void {
    log.error(exDescription, exFatal);
}
