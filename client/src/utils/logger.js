export function logEvent(category, action, label) {
    global.ga('send', 'event', category, action, label);
}

export function logError(exDescription, exFatal) {
    global.ga('send', 'exception', {exDescription, exFatal});
}
