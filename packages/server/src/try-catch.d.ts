declare module 'try-catch' {
    type TryResult<T> = [Error, undefined] | [null, T];
    
    export function tryCatch<T>(fn: (...args: unknown[]) => T, ...args: unknown[]): TryResult<T>;
}
