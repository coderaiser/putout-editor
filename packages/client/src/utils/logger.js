export const log = {
    event: console.log.bind(console),
    error: console.log.bind(console),
};

export function logEvent(category, action, label) {
    log.event(category, action, label);
}

export function logError(exDescription, exFatal) {
    log.error(exDescription, exFatal);
}
