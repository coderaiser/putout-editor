const isNumber = (a: unknown): a is number => !Number.isNaN(a) && typeof a === 'number';
const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';
const isFn = (a: unknown): a is Function => typeof a === 'function';

export default function stringify(value: unknown): string | number {
    if (isFn(value)) {
        const matched = value
            .toString()
            .match(/function[^(]*\([^)]*\)/);
        
        return matched![0];
    }
    
    if (typeof value === 'object')
        return value ? JSON.stringify(value, stringify) : 'null';
    
    if (isUndefined(value))
        return 'undefined';
    
    if (typeof value === 'number')
        return globalThis.isNaN(value) ? 'NaN' : value;
    
    return String(JSON.stringify(value));
}
