const isObject = (a: unknown): a is object => a as boolean && typeof a === 'object';
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
    
    if (isUndefined(value))
        return 'undefined';
    
    if (Number.isNaN(value))
        return 'NaN';
    
    if (value === null)
        return 'null';
    
    if (isObject(value))
        return JSON.stringify(value, stringify);
    
    if (isNumber(value))
        return value;
    
    return String(JSON.stringify(value));
}

