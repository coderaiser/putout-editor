export default function debounce<F extends (...args: unknown[]) => void>(fn: F, timeout = 100): (...args: Parameters<F>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<F>;
    
    return function(this: unknown, ...args: Parameters<F>) {
        lastArgs = args;
        
        if (timer)
            return;
        
        timer = setTimeout(() => {
            timer = null;
            fn.apply(this, lastArgs);
        }, timeout);
    };
}
