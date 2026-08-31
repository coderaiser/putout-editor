declare module 'supertape' {
    export function test(name: string, callback: (t: any) => void): void;
    export function stub(): any;
}

declare module 'try-catch';
declare module 'try-to-catch';
declare module 'lodash.isequal';
