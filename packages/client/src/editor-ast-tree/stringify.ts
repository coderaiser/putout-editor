export default function stringify(value: unknown): string | number {
    switch(typeof value) {
    case 'function': {
        const matched = value
            .toString()
            .match(/function[^(]*\([^)]*\)/);
        
        return matched![0];
    }
    
    case 'object':
        return value ? JSON.stringify(value, stringify) : 'null';
    
    case 'undefined':
        return 'undefined';
    
    case 'number':
        return globalThis.isNaN(value) ? 'NaN' : value;
    
    default:
        return String(JSON.stringify(value));
    }
}
